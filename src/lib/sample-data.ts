
export const sampleUsers = [
    { id: 'player1', name: 'Alex Johnson', email: 'alex.j@example.com', role: 'player', age: 24, experience: 'Intermediate', goals: 'Increase strength' },
    { id: 'player2', name: 'Maria Garcia', email: 'maria.g@example.com', role: 'player', age: 28, experience: 'Advanced', goals: 'Run a marathon' },
    { id: 'player3', name: 'Sam Chen', email: 'sam.c@example.com', role: 'player', age: 22, experience: 'Beginner', goals: 'Improve overall fitness' },
    { id: 'player4', name: 'Emily Rodriguez', email: 'emily.r@example.com', role: 'player', age: 31, experience: 'Intermediate', goals: 'Tone up' },
    { id: 'coach1', name: 'Coach Davis', email: 'davis.c@example.com', role: 'coach' },
    { id: 'coach2', name: 'Coach Miller', email: 'miller.c@example.com', role: 'coach' },
];

export const sampleWorkouts = [
    { _id: 'w1', userId: 'player1', exercise: 'Bench Press', reps: 8, weight: 100, createdAt: new Date('2024-07-20T10:00:00Z') },
    { _id: 'w2', userId: 'player1', exercise: 'Squat', reps: 10, weight: 120, createdAt: new Date('2024-07-22T10:00:00Z') },
    { _id: 'w3', userId: 'player2', exercise: 'Running', distance: 10, time: '55:00', createdAt: new Date('2024-07-21T08:00:00Z') },
    { _id: 'w4', userId: 'player3', exercise: 'Push-ups', reps: 20, createdAt: new Date('2024-07-22T12:00:00Z') },
];

export const sampleConversations = [
    {
        _id: 'coach1_player1',
        participantIds: ['coach1', 'player1'],
        messages: [
            { _id: 'm1', senderId: 'coach1', text: 'Great work on the bench press yesterday, Alex!', createdAt: new Date('2024-07-21T11:00:00Z') },
            { _id: 'm2', senderId: 'player1', text: 'Thanks, Coach! Felt strong.', createdAt: new Date('2024-07-21T11:05:00Z') },
        ]
    },
    {
        _id: 'coach1_player2',
        participantIds: ['coach1', 'player2'],
        messages: [
            { _id: 'm3', senderId: 'coach1', text: 'Your marathon training is looking solid. Keep it up!', createdAt: new Date('2024-07-21T14:00:00Z') },
        ]
    },
     {
        _id: 'coach2_player3',
        participantIds: ['coach2', 'player3'],
        messages: [
            { _id: 'm4', senderId: 'coach2', text: 'Welcome to the program, Sam. Let\'s get started on your fitness goals.', createdAt: new Date('2024-07-22T13:00:00Z') },
            { _id: 'm5', senderId: 'player3', text: 'Excited to be here, Coach!', createdAt: new Date('2024-07-22T13:02:00Z') },
        ]
    }
];
