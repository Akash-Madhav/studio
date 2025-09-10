

export const sampleUsers = [
    // Players
    { id: 'player1', name: 'Alex Johnson', email: 'alex.j@example.com', role: 'player' as const, dob: '1999-08-15', experience: 'Intermediate', goals: 'Increase bench press by 20kg and improve overall muscle definition.', status: 'active' },
    { id: 'player2', name: 'Maria Garcia', email: 'maria.g@example.com', role: 'player' as const, dob: '1995-05-20', experience: 'Advanced', goals: 'Complete a full marathon in under 4 hours.', status: 'recruited' },
    { id: 'player3', name: 'Sam Chen', email: 'sam.c@example.com', role: 'player' as const, dob: '2001-11-10', experience: 'Beginner', goals: 'Build a consistent workout routine, focusing on bodyweight exercises and light cardio.', status: 'active' },
    { id: 'player4', name: 'Emily Rodriguez', email: 'emily.r@example.com', role: 'player' as const, dob: '1992-03-25', experience: 'Intermediate', goals: 'Improve cardiovascular health and tone up for summer.', status: 'recruited' },
    { id: 'player5', name: 'David Lee', email: 'david.l@example.com', role: 'player' as const, dob: '1997-07-30', experience: 'Advanced', goals: 'Compete in a local CrossFit competition.', status: 'pending_invite' },
    { id: 'player6', name: 'Priya Sharma', email: 'priya.s@example.com', role: 'player' as const, dob: '2000-01-22', experience: 'Beginner', goals: 'Learn proper form for major lifts like squat, deadlift, and bench press.', status: 'active' },
    { id: 'player7', name: 'Kenji Tanaka', email: 'kenji.t@example.com', role: 'player' as const, dob: '1998-06-06', experience: 'Intermediate', goals: 'Improve 5k time and increase flexibility through yoga.', status: 'active' },
    { id: 'player8', name: 'Fatima Al-Sayed', email: 'fatima.a@example.com', role: 'player' as const, dob: '1994-09-01', experience: 'Advanced', goals: 'Master advanced calisthenics moves like the human flag.', status: 'pending_invite' },
    { id: 'player9', name: 'Leo Martinez', email: 'leo.m@example.com', role: 'player' as const, dob: '2002-04-12', experience: 'Beginner', goals: 'Gain 5kg of muscle mass in the next 6 months.', status: 'active'},
    
    // Coaches
    { id: 'coach1', name: 'Coach Davis', email: 'davis.c@example.com', role: 'coach' as const, dob: '1985-02-20', experience: '10+ years', goals: 'Train national-level athletes.', status: 'active' },
    { id: 'coach2', name: 'Coach Miller', email: 'miller.c@example.com', role: 'coach' as const, dob: '1988-09-05', experience: '8 years', goals: 'Focus on youth athletic development.', status: 'active' },
    { id: 'coach3', name: 'Coach Taylor', email: 'taylor.c@example.com', role: 'coach' as const, dob: '1990-12-12', experience: '5 years', goals: 'Specialize in endurance sports coaching.', status: 'active' },
];

export const sampleWorkouts = [
    // Player 1: Alex Johnson (Strength Training) - More history
    { _id: 'w1', userId: 'player1', exercise: 'Bench Press', reps: 5, weight: 95, createdAt: '2024-04-15T10:00:00Z' },
    { _id: 'w2', userId: 'player1', exercise: 'Squat', reps: 8, weight: 115, createdAt: '2024-04-20T10:00:00Z' },
    { _id: 'w3', userId: 'player1', exercise: 'Bench Press', reps: 8, weight: 100, createdAt: '2024-05-15T10:00:00Z' },
    { _id: 'w4', userId: 'player1', exercise: 'Squat', reps: 10, weight: 120, createdAt: '2024-05-20T10:00:00Z' },
    { _id: 'w5', userId: 'player1', exercise: 'Deadlift', reps: 5, weight: 140, createdAt: '2024-06-10T10:00:00Z' },
    { _id: 'w6', userId: 'player1', exercise: 'Bench Press', reps: 6, weight: 105, createdAt: '2024-06-25T10:00:00Z' },
    { _id: 'w7', userId: 'player1', exercise: 'Overhead Press', reps: 8, weight: 60, createdAt: '2024-07-10T10:00:00Z' },
    { _id: 'w8', userId: 'player1', exercise: 'Squat', reps: 8, weight: 125, createdAt: '2024-07-22T10:00:00Z' },
    { _id: 'w9', userId: 'player1', exercise: 'Bench Press', reps: 5, weight: 110, createdAt: '2024-07-25T10:00:00Z' },
    
    // Player 2: Maria Garcia (Endurance Training) - More history
    { _id: 'w10', userId: 'player2', exercise: 'Running', distance: 5, time: '32:00', createdAt: '2024-05-01T08:00:00Z' },
    { _id: 'w11', userId: 'player2', exercise: 'Running', distance: 5, time: '30:00', createdAt: '2024-06-01T08:00:00Z' },
    { _id: 'w12', userId: 'player2', exercise: 'Cycling', distance: 20, time: '60:00', createdAt: '2024-06-15T08:00:00Z' },
    { _id: 'w13', userId: 'player2', exercise: 'Running', distance: 10, time: '58:00', createdAt: '2024-07-01T08:00:00Z' },
    { _id: 'w14', userId: 'player2', exercise: 'Swimming', distance: 1.5, time: '45:00', createdAt: '2024-07-10T08:00:00Z' },
    { _id: 'w15', userId: 'player2', exercise: 'Running', distance: 15, time: '90:00', createdAt: '2024-07-21T08:00:00Z' },

    // Player 3: Sam Chen (Beginner Fitness)
    { _id: 'w16', userId: 'player3', exercise: 'Push-ups', reps: 10, createdAt: '2024-07-10T12:00:00Z' },
    { _id: 'w17', userId: 'player3', exercise: 'Bodyweight Squats', reps: 20, createdAt: '2024-07-15T12:00:00Z' },
    { _id: 'w18', userId: 'player3', exercise: 'Plank', time: '0:45', createdAt: '2024-07-20T12:00:00Z' },
    { _id: 'w19', userId: 'player3', exercise: 'Jumping Jacks', time: '2:00', createdAt: '2024-07-22T12:00:00Z' },
    { _id: 'w20', userId: 'player3', exercise: 'Push-ups', reps: 15, createdAt: '2024-07-25T12:00:00Z' },

    // Player 4: Emily Rodriguez (Cardio & Toning)
    { _id: 'w21', userId: 'player4', exercise: 'Elliptical', distance: 5, time: '30:00', createdAt: '2024-07-05T18:00:00Z' },
    { _id: 'w22', userId: 'player4', exercise: 'Dumbbell Lunges', reps: 12, weight: 10, createdAt: '2024-07-12T18:00:00Z' },
    { _id: 'w23', userId: 'player4', exercise: 'HIIT', time: '20:00', createdAt: '2024-07-19T18:00:00Z' },
    { _id: 'w24', userId: 'player4', exercise: 'Yoga', time: '60:00', createdAt: '2024-07-24T18:00:00Z' },
    
    // Player 5: David Lee (CrossFit)
    { _id: 'w25', userId: 'player5', exercise: 'Clean and Jerk', reps: 5, weight: 80, createdAt: '2024-07-18T09:00:00Z' },
    { _id: 'w26', userId: 'player5', exercise: 'Box Jumps', reps: 20, createdAt: '2024-07-20T09:00:00Z' },
    { _id: 'w27', userId: 'player5', exercise: 'Kettlebell Swings', reps: 25, weight: 24, createdAt: '2024-07-23T09:00:00Z' },

    // Player 6: Priya Sharma (New Lifter)
    { _id: 'w28', userId: 'player6', exercise: 'Goblet Squat', reps: 10, weight: 12, createdAt: '2024-07-20T17:00:00Z' },
    { _id: 'w29', userId: 'player6', exercise: 'Romanian Deadlift', reps: 12, weight: 20, createdAt: '2024-07-22T17:00:00Z' },
    { _id: 'w30', userId: 'player6', exercise: 'Lat Pulldown', reps: 10, weight: 30, createdAt: '2024-07-24T17:00:00Z' },
    { _id: 'w31', userId: 'player6', exercise: 'Goblet Squat', reps: 12, weight: 12, createdAt: '2024-07-27T17:00:00Z' },

    // Player 7: Kenji Tanaka (Running & Flexibilty)
    { _id: 'w32', userId: 'player7', exercise: 'Running', distance: 3, time: '18:00', createdAt: '2024-06-05T07:00:00Z' },
    { _id: 'w33', userId: 'player7', exercise: 'Yoga', time: '45:00', createdAt: '2024-06-12T07:00:00Z' },
    { _id: 'w34', userId: 'player7', exercise: 'Running', distance: 5, time: '28:00', createdAt: '2024-07-19T07:00:00Z' },
    { _id: 'w35', userId: 'player7', exercise: 'Yoga', time: '60:00', createdAt: '2024-07-26T07:00:00Z' },

    // Player 8: Fatima Al-Sayed (Calisthenics)
    { _id: 'w36', userId: 'player8', exercise: 'Pull-ups', reps: 8, createdAt: '2024-07-15T19:00:00Z' },
    { _id: 'w37', userId: 'player8', exercise: 'Dips', reps: 15, createdAt: '2024-07-18T19:00:00Z' },
    { _id: 'w38', userId: 'player8', exercise: 'L-Sit', time: '0:30', createdAt: '2024-07-21T19:00:00Z' },
    { _id: 'w39', userId: 'player8', exercise: 'Pistol Squat', reps: 10, createdAt: '2024-07-25T19:00:00Z' },

    // Player 9: Leo Martinez (Bodybuilding)
    { _id: 'w40', userId: 'player9', exercise: 'Bicep Curls', reps: 12, weight: 15, createdAt: '2024-07-27T15:00:00Z' },
    { _id: 'w41', userId: 'player9', exercise: 'Tricep Extensions', reps: 12, weight: 25, createdAt: '2024-07-27T15:30:00Z' },
    { _id: 'w42', userId: 'player9', exercise: 'Leg Press', reps: 10, weight: 150, createdAt: '2024-07-28T16:00:00Z' },

];
