
export const sampleUsers = [
    { id: 'player1', name: 'Alex Johnson', email: 'alex.j@example.com', role: 'player', age: 24, experience: 'Intermediate', goals: 'Increase bench press by 20kg and improve overall muscle definition.' },
    { id: 'player2', name: 'Maria Garcia', email: 'maria.g@example.com', role: 'player', age: 28, experience: 'Advanced', goals: 'Complete a full marathon in under 4 hours.' },
    { id: 'player3', name: 'Sam Chen', email: 'sam.c@example.com', role: 'player', age: 22, experience: 'Beginner', goals: 'Build a consistent workout routine, focusing on bodyweight exercises and light cardio.' },
    { id: 'player4', name: 'Emily Rodriguez', email: 'emily.r@example.com', role: 'player', age: 31, experience: 'Intermediate', goals: 'Improve cardiovascular health and tone up for summer.' },
    { id: 'player5', name: 'David Lee', email: 'david.l@example.com', role: 'player', age: 26, experience: 'Advanced', goals: 'Compete in a local CrossFit competition.'},
    { id: 'coach1', name: 'Coach Davis', email: 'davis.c@example.com', role: 'coach' },
    { id: 'coach2', name: 'Coach Miller', email: 'miller.c@example.com', role: 'coach' },
];

export const sampleWorkouts = [
    // Player 1: Alex Johnson (Strength Training)
    { _id: 'w1', userId: 'player1', exercise: 'Bench Press', reps: 8, weight: 100, createdAt: new Date('2024-05-15T10:00:00Z') },
    { _id: 'w2', userId: 'player1', exercise: 'Squat', reps: 10, weight: 120, createdAt: new Date('2024-05-20T10:00:00Z') },
    { _id: 'w3', userId: 'player1', exercise: 'Deadlift', reps: 5, weight: 140, createdAt: new Date('2024-06-10T10:00:00Z') },
    { _id: 'w4', userId: 'player1', exercise: 'Bench Press', reps: 6, weight: 105, createdAt: new Date('2024-06-25T10:00:00Z') },
    { _id: 'w5', userId: 'player1', exercise: 'Overhead Press', reps: 8, weight: 60, createdAt: new Date('2024-07-10T10:00:00Z') },
    { _id: 'w6', userId: 'player1', exercise: 'Squat', reps: 8, weight: 125, createdAt: new Date('2024-07-22T10:00:00Z') },
    { _id: 'w7', userId: 'player1', exercise: 'Bench Press', reps: 5, weight: 110, createdAt: new Date('2024-07-25T10:00:00Z') },
    
    // Player 2: Maria Garcia (Endurance Training)
    { _id: 'w8', userId: 'player2', exercise: 'Running', distance: 5, time: '30:00', createdAt: new Date('2024-06-01T08:00:00Z') },
    { _id: 'w9', userId: 'player2', exercise: 'Cycling', distance: 20, time: '60:00', createdAt: new Date('2024-06-15T08:00:00Z') },
    { _id: 'w10', userId: 'player2', exercise: 'Running', distance: 10, time: '58:00', createdAt: new Date('2024-07-01T08:00:00Z') },
    { _id: 'w11', userId: 'player2', exercise: 'Swimming', distance: 1.5, time: '45:00', createdAt: new Date('2024-07-10T08:00:00Z') },
    { _id: 'w12', userId: 'player2', exercise: 'Running', distance: 15, time: '90:00', createdAt: new Date('2024-07-21T08:00:00Z') },

    // Player 3: Sam Chen (Beginner Fitness)
    { _id: 'w13', userId: 'player3', exercise: 'Push-ups', reps: 10, createdAt: new Date('2024-07-10T12:00:00Z') },
    { _id: 'w14', userId: 'player3', exercise: 'Bodyweight Squats', reps: 20, createdAt: new Date('2024-07-15T12:00:00Z') },
    { _id: 'w15', userId: 'player3', exercise: 'Plank', time: '0:45', createdAt: new Date('2024-07-20T12:00:00Z') },
    { _id: 'w16', userId: 'player3', exercise: 'Jumping Jacks', time: '2:00', createdAt: new Date('2024-07-22T12:00:00Z') },
    { _id: 'w17', userId: 'player3', exercise: 'Push-ups', reps: 15, createdAt: new Date('2024-07-25T12:00:00Z') },

    // Player 4: Emily Rodriguez (Cardio & Toning)
    { _id: 'w18', userId: 'player4', exercise: 'Elliptical', distance: 5, time: '30:00', createdAt: new Date('2024-07-05T18:00:00Z') },
    { _id: 'w19', userId: 'player4', exercise: 'Dumbbell Lunges', reps: 12, weight: 10, createdAt: new Date('2024-07-12T18:00:00Z') },
    { _id: 'w20', userId: 'player4', exercise: 'HIIT', time: '20:00', createdAt: new Date('2024-07-19T18:00:00Z') },
    { _id: 'w21', userId: 'player4', exercise: 'Yoga', time: '60:00', createdAt: new Date('2024-07-24T18:00:00Z') },
    
    // Player 5: David Lee (CrossFit)
    { _id: 'w22', userId: 'player5', exercise: 'Clean and Jerk', reps: 5, weight: 80, createdAt: new Date('2024-07-18T09:00:00Z') },
    { _id: 'w23', userId: 'player5', exercise: 'Box Jumps', reps: 20, createdAt: new Date('2024-07-20T09:00:00Z') },
    { _id: 'w24', userId: 'player5', exercise: 'Kettlebell Swings', reps: 25, weight: 24, createdAt: new Date('2024-07-23T09:00:00Z') },
];

export const sampleConversations = [
    {
        _id: 'coach1_player1',
        participantIds: ['coach1', 'player1'],
        messages: [
            { _id: 'm1', senderId: 'coach1', text: 'Your bench press is up by 10kg! Fantastic progress, Alex. How are you feeling?', createdAt: new Date('2024-07-25T11:00:00Z') },
            { _id: 'm2', senderId: 'player1', text: 'Thanks, Coach! Feeling strong. I want to hit 120kg by next month. Think that\'s realistic?', createdAt: new Date('2024-07-25T11:05:00Z') },
            { _id: 'm3', senderId: 'coach1', text: 'Ambitious, I like it. Let\'s adjust your programming to focus a bit more on chest and triceps. I\'ll send over some ideas.', createdAt: new Date('2024-07-25T11:10:00Z') },
        ]
    },
    {
        _id: 'coach1_player2',
        participantIds: ['coach1', 'player2'],
        messages: [
            { _id: 'm4', senderId: 'coach1', text: 'Maria, your 15k run was impressive. Your pacing is getting much more consistent. Remember to incorporate a recovery day this week.', createdAt: new Date('2024-07-22T14:00:00Z') },
            { _id: 'm5', senderId: 'player2', text: 'Will do, thanks Coach. The new running shoes made a huge difference.', createdAt: new Date('2024-07-22T14:05:00Z') },
        ]
    },
    {
        _id: 'coach2_player3',
        participantIds: ['coach2', 'player3'],
        messages: [
            { _id: 'm6', senderId: 'coach2', text: 'Welcome to the program, Sam. Saw you logged your first few workouts. Great start! Consistency is key.', createdAt: new Date('2024-07-23T13:00:00Z') },
            { _id: 'm7', senderId: 'player3', text: 'Excited to be here, Coach! The push-ups were tougher than I expected.', createdAt: new Date('2024-07-23T13:02:00Z') },
            { _id: 'm8', senderId: 'coach2', text: 'That\'s normal. We\'ll build up that strength. Try doing them on your knees for now if you need to, and focus on form.', createdAt: new Date('2024-07-23T13:05:00Z') },
        ]
    },
    {
        _id: 'coach1_player5',
        participantIds: ['coach1', 'player5'],
        messages: [
            { _id: 'm9', senderId: 'coach1', text: 'David, your Clean and Jerk form is looking sharp. Let\'s work on the speed of your dip and drive.', createdAt: new Date('2024-07-24T10:00:00Z') },
        ]
    }
];
