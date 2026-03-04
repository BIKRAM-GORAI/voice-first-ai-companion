export const shouldTriggerCuriosity = () => {

  const chance = Math.random();

  return chance < 0.20; // 20% chance

};


export const pickCuriosityMemory = (memories) => {

  if (!memories || memories.length === 0) return null;

  const index = Math.floor(Math.random() * memories.length);

  return memories[index];

};