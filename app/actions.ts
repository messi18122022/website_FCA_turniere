'use server'

export async function checkTrainerPin(pin: string): Promise<boolean> {
  const trainerPin = process.env.TRAINER_PIN
  if (!trainerPin) return false
  return pin === trainerPin
}
