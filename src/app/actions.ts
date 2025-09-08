
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const formSchema = z.object({
  exercise: z.string().min(2, "Exercise name is required."),
  reps: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  time: z.string().optional(),
  distance: z.coerce.number().min(0).optional(),
});

export async function logWorkout(values: z.infer<typeof formSchema>) {
  const validatedData = formSchema.parse(values);
  try {
    const docRef = await addDoc(collection(db, "workouts"), {
      ...validatedData,
      createdAt: new Date(),
    });
    console.log("Document written with ID: ", docRef.id);
    return { success: true, message: `${validatedData.exercise} has been added to your history.` };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, message: "Failed to log workout." };
  }
}
