
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
    // Player 1: Alex Johnson (Strength Training)
    { userId: 'player1', exercise: 'Bench Press', reps: 5, weight: 105, createdAt: '2024-07-25T10:00:00Z' },
    { userId: 'player1', exercise: 'Squat', reps: 8, weight: 125, createdAt: '2024-07-22T10:00:00Z' },
    
    // Player 2: Maria Garcia (Endurance Training)
    { userId: 'player2', exercise: 'Running', distance: 15, time: '90:00', createdAt: '2024-07-21T08:00:00Z' },
    { userId: 'player2', exercise: 'Swimming', distance: 1.5, time: '45:00', createdAt: '2024-07-10T08:00:00Z' },

    // Player 3: Sam Chen (Beginner Fitness)
    { userId: 'player3', exercise: 'Push-ups', reps: 15, createdAt: '2024-07-25T12:00:00Z' },

    // Player 4: Emily Rodriguez (Cardio & Toning)
    { userId: 'player4', exercise: 'Yoga', time: '60:00', createdAt: '2024-07-24T18:00:00Z' },
    
    // Player 5: David Lee (CrossFit)
    { userId: 'player5', exercise: 'Kettlebell Swings', reps: 25, weight: 24, createdAt: '2024-07-23T09:00:00Z' },

    // Player 6: Priya Sharma (New Lifter)
    { userId: 'player6', exercise: 'Goblet Squat', reps: 12, weight: 12, createdAt: '2024-07-27T17:00:00Z' },

    // Player 7: Kenji Tanaka (Running & Flexibilty)
    { userId: 'player7', exercise: 'Yoga', time: '60:00', createdAt: '2024-07-26T07:00:00Z' },

    // Player 8: Fatima Al-Sayed (Calisthenics)
    { userId: 'player8', exercise: 'Pistol Squat', reps: 10, createdAt: '2024-07-25T19:00:00Z' },

    // Player 9: Leo Martinez (Bodybuilding)
    { userId: 'player9', exercise: 'Leg Press', reps: 10, weight: 150, createdAt: '2024-07-28T16:00:00Z' },
];
