import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useFlower } from '../../src/ble/FlowerProvider';

/** 예전 물주기 완료 화면. 지금은 기기 상태에 따라 blooming/bloomed로 바로 보냅니다. */
export default function WaterDoneScreen() {
  const router = useRouter();
  const flower = useFlower();

  useEffect(() => {
    const alreadyBloomed = flower.pos === 0 || flower.wiltPercent === 0;
    router.replace(flower.connection === 'connected' && !alreadyBloomed ? '/water/blooming' : '/water/bloomed');
  }, [flower.connection, flower.pos, flower.wiltPercent, router]);

  return null;
}
