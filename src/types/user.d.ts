export type User = {
    id: string,
    name: string,
    email: string,
    birthday: string, // ISO date string
    gender: 'male' | 'female' | 'non-binary' | 'prefer not to say',
    interestedIn: 'men' | 'women' | 'other' | 'prefer not to say',
    bio?: string,
    isAdmin?: boolean,
    createdAt?: string,
    authProvider?: string
}