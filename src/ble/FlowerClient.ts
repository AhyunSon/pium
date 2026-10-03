import { PermissionsAndroid, Platform } from 'react-native';
import { decodeBase64, encodeBase64 } from './base64';
import {
  FLOWER_COMMAND_UUID,
  FLOWER_MAX_POSITION,
  FLOWER_SERVICE_UUID,
  FLOWER_STATUS_UUID,
  FlowerCommand,
  SCAN_TIMEOUT_MS,
} from './constants';
import { FlowerStatus, parseStatus } from './parseStatus';

export type ConnectionState =
  | 'unavailable'
  | 'poweredOff'
  | 'unauthorized'
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'notFound'
  | 'error';

type Listener<T> = (value: T) => void;

export interface FlowerClient {
  readonly kind: 'ble' | 'mock';
  onState(listener: Listener<ConnectionState>): () => void;
  onStatus(listener: Listener<FlowerStatus>): () => void;
  onError(listener: Listener<string>): () => void;
  getState(): ConnectionState;
  connect(deviceName: string): Promise<void>;
  disconnect(): Promise<void>;
  send(command: FlowerCommand): Promise<void>;
  destroy(): void;
}

class Emitter<T> {
  private listeners = new Set<Listener<T>>();
  add(l: Listener<T>) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }
  emit(v: T) {
    this.listeners.forEach((l) => l(v));
  }
}

// ---------------------------------------------------------------------------
// 실제 BLE (개발 빌드에서만 동작)
// ---------------------------------------------------------------------------

type BlePlxModule = typeof import('@sfourdrinier/react-native-ble-plx');

function loadBlePlx(): BlePlxModule | null {
  try {
    // Expo Go에는 네이티브 모듈이 없어 require가 던집니다. 그때는 mock으로 갑니다.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@sfourdrinier/react-native-ble-plx') as BlePlxModule;
    if (!mod?.BleManager) return null;
    return mod;
  } catch {
    return null;
  }
}

/** 온보딩 권한 화면에서 미리 물어볼 때 씁니다. 연결 때도 같은 함수를 다시 거칩니다. */
export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') return requestIosBluetooth();
  return ensureAndroidPermissions();
}

async function requestIosBluetooth(): Promise<boolean> {
  const mod = loadBlePlx();
  if (!mod) return true;
  const manager = new mod.BleManager();
  try {
    const waitState = () =>
      new Promise<string>((resolve) => {
        const sub = manager.onStateChange((s) => {
          if (s !== 'Unknown' && s !== 'Resetting') {
            sub.remove();
            resolve(s);
          }
        }, true);
        setTimeout(() => {
          sub.remove();
          manager.state().then(resolve).catch(() => resolve('Unknown'));
        }, 2500);
      });
    const state = await waitState();
    return state !== 'Unauthorized';
  } catch {
    return true;
  } finally {
    manager.destroy();
  }
}

async function ensureAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const api = Number(Platform.Version);
  if (api >= 31) {
    const res = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(res).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  }
  const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

class BleFlowerClient implements FlowerClient {
  readonly kind = 'ble' as const;
  private manager: InstanceType<BlePlxModule['BleManager']>;
  private state: ConnectionState = 'idle';
  private stateEmitter = new Emitter<ConnectionState>();
  private statusEmitter = new Emitter<FlowerStatus>();
  private errorEmitter = new Emitter<string>();
  private deviceId: string | null = null;
  private monitorSub: { remove: () => void } | null = null;
  private disconnectSub: { remove: () => void } | null = null;
  private stateSub: { remove: () => void } | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private mod: BlePlxModule) {
    this.manager = new mod.BleManager();
    this.stateSub = this.manager.onStateChange((s) => {
      if (s === 'PoweredOff') this.setState('poweredOff');
      else if (s === 'Unauthorized') this.setState('unauthorized');
      else if (s === 'Unsupported') this.setState('unavailable');
      else if (s === 'PoweredOn' && (this.state === 'poweredOff' || this.state === 'unauthorized')) {
        this.setState('idle');
      }
    }, true);
  }

  getState() {
    return this.state;
  }
  onState(l: Listener<ConnectionState>) {
    return this.stateEmitter.add(l);
  }
  onStatus(l: Listener<FlowerStatus>) {
    return this.statusEmitter.add(l);
  }
  onError(l: Listener<string>) {
    return this.errorEmitter.add(l);
  }

  private setState(s: ConnectionState) {
    if (this.state === s) return;
    this.state = s;
    this.stateEmitter.emit(s);
  }

  private fail(message: string, state: ConnectionState = 'error') {
    this.errorEmitter.emit(message);
    this.setState(state);
  }

  async connect(deviceName: string): Promise<void> {
    if (this.state === 'scanning' || this.state === 'connecting') return;
    const granted = await requestBluetoothPermissions();
    if (!granted) {
      this.fail('블루투스 권한이 필요합니다.', 'unauthorized');
      return;
    }
    const bleState = await this.manager.state();
    if (bleState === 'PoweredOff') {
      this.fail('블루투스가 꺼져 있습니다.', 'poweredOff');
      return;
    }

    this.setState('scanning');
    await this.manager.stopDeviceScan().catch(() => {});

    const found = await new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (id: string | null) => {
        if (settled) return;
        settled = true;
        if (this.scanTimer) clearTimeout(this.scanTimer);
        this.manager.stopDeviceScan().catch(() => {});
        resolve(id);
      };
      this.scanTimer = setTimeout(() => finish(null), SCAN_TIMEOUT_MS);
      this.manager
        .startDeviceScan([FLOWER_SERVICE_UUID], { allowDuplicates: false }, (error, device) => {
          if (error) {
            this.errorEmitter.emit(error.message);
            finish(null);
            return;
          }
          if (!device) return;
          const name = device.name ?? device.localName ?? '';
          if (name === deviceName || name.startsWith('C33_FLOWER')) finish(device.id);
        })
        .catch((e: Error) => {
          this.errorEmitter.emit(e.message);
          finish(null);
        });
    });

    if (!found) {
      this.setState('notFound');
      return;
    }

    this.setState('connecting');
    try {
      const device = await this.manager.connectToDevice(found, { timeout: 10000 });
      await device.discoverAllServicesAndCharacteristics();
      this.deviceId = device.id;

      this.disconnectSub?.remove();
      this.disconnectSub = this.manager.onDeviceDisconnected(device.id, () => {
        this.cleanupDevice();
        this.setState('idle');
      });

      this.monitorSub?.remove();
      this.monitorSub = this.manager.monitorCharacteristicForDevice(
        device.id,
        FLOWER_SERVICE_UUID,
        FLOWER_STATUS_UUID,
        (error, characteristic) => {
          if (error) {
            if (this.state === 'connected') this.errorEmitter.emit(error.message);
            return;
          }
          if (characteristic?.value) {
            this.statusEmitter.emit(parseStatus(decodeBase64(characteristic.value)));
          }
        },
      );

      // 첫 값은 notify 전에 read로 한 번 가져옵니다.
      try {
        const first = await this.manager.readCharacteristicForDevice(
          device.id,
          FLOWER_SERVICE_UUID,
          FLOWER_STATUS_UUID,
        );
        if (first.value) this.statusEmitter.emit(parseStatus(decodeBase64(first.value)));
      } catch {
        // notify로 곧 옵니다
      }

      this.setState('connected');
    } catch (e) {
      this.cleanupDevice();
      this.fail(e instanceof Error ? e.message : '연결에 실패했습니다.');
    }
  }

  private cleanupDevice() {
    this.monitorSub?.remove();
    this.monitorSub = null;
    this.disconnectSub?.remove();
    this.disconnectSub = null;
    this.deviceId = null;
  }

  async disconnect(): Promise<void> {
    const id = this.deviceId;
    this.cleanupDevice();
    if (id) await this.manager.cancelDeviceConnection(id).catch(() => {});
    this.setState('idle');
  }

  async send(command: FlowerCommand): Promise<void> {
    if (!this.deviceId) throw new Error('기기가 연결되어 있지 않습니다.');
    await this.manager.writeCharacteristicWithResponseForDevice(
      this.deviceId,
      FLOWER_SERVICE_UUID,
      FLOWER_COMMAND_UUID,
      encodeBase64(command),
    );
  }

  destroy() {
    this.cleanupDevice();
    this.stateSub?.remove();
    if (this.scanTimer) clearTimeout(this.scanTimer);
    this.manager.destroy();
  }
}

// ---------------------------------------------------------------------------
// Mock (Expo Go, 시뮬레이터, 기기 없이 화면 볼 때)
// ---------------------------------------------------------------------------

class MockFlowerClient implements FlowerClient {
  readonly kind = 'mock' as const;
  private state: ConnectionState = 'idle';
  private stateEmitter = new Emitter<ConnectionState>();
  private statusEmitter = new Emitter<FlowerStatus>();
  private errorEmitter = new Emitter<string>();
  private pos = 5200;
  private motor: 'STOP' | 'HOME' | 'FWD' = 'STOP';
  private tick: ReturnType<typeof setInterval> | null = null;
  private lastStep = Date.now();

  getState() {
    return this.state;
  }
  onState(l: Listener<ConnectionState>) {
    return this.stateEmitter.add(l);
  }
  onStatus(l: Listener<FlowerStatus>) {
    return this.statusEmitter.add(l);
  }
  onError(l: Listener<string>) {
    return this.errorEmitter.add(l);
  }

  private setState(s: ConnectionState) {
    this.state = s;
    this.stateEmitter.emit(s);
  }

  private emitPeriodic() {
    const sw = this.pos <= 0 ? 1 : 0;
    this.statusEmitter.emit(parseStatus(`${this.motor} POS:${this.pos} SW:${sw}`));
  }

  async connect(): Promise<void> {
    if (this.state === 'connected') return;
    this.setState('scanning');
    await new Promise((r) => setTimeout(r, 900));
    this.setState('connecting');
    await new Promise((r) => setTimeout(r, 600));
    this.setState('connected');
    this.tick = setInterval(() => {
      const now = Date.now();
      if (this.motor === 'HOME') {
        this.pos = Math.max(0, this.pos - 400);
        if (this.pos === 0) {
          this.motor = 'STOP';
          this.statusEmitter.emit(parseStatus('HOME OK POS:0'));
          this.lastStep = now;
          return;
        }
      } else if (this.motor === 'STOP' && now - this.lastStep > 20000 && this.pos < FLOWER_MAX_POSITION) {
        // 데모용: 20초마다 10씩 시듭니다 (펌웨어는 3분).
        this.pos = Math.min(FLOWER_MAX_POSITION, this.pos + 10);
        this.lastStep = now;
      }
      this.emitPeriodic();
    }, 500);
  }

  async disconnect(): Promise<void> {
    if (this.tick) clearInterval(this.tick);
    this.tick = null;
    this.setState('idle');
  }

  async send(command: FlowerCommand): Promise<void> {
    if (this.state !== 'connected') throw new Error('기기가 연결되어 있지 않습니다.');
    if (command === 'RESET') {
      this.statusEmitter.emit(parseStatus(`WATER_POS:${this.pos}`));
      this.motor = 'HOME';
      return;
    }
    if (command.startsWith('SETPOS:')) {
      this.pos = Number(command.slice(7));
      this.statusEmitter.emit(parseStatus(`SET POS:${this.pos}`));
      return;
    }
    if (command.startsWith('MOVEPOS:')) {
      this.pos = Number(command.slice(8));
      this.statusEmitter.emit(parseStatus(`MOVE OK:${this.pos}`));
      return;
    }
    if (command === 'TEST') {
      this.statusEmitter.emit(parseStatus(`TEST_FWD POS:${this.pos}`));
    }
  }

  destroy() {
    if (this.tick) clearInterval(this.tick);
  }
}

export function createFlowerClient(): FlowerClient {
  const mod = loadBlePlx();
  if (!mod) return new MockFlowerClient();
  try {
    return new BleFlowerClient(mod);
  } catch {
    return new MockFlowerClient();
  }
}
