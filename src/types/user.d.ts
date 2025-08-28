export type User = {
    id: string,
    name: string,
    email: string,
    birthday: string, // ISO date string
    gender: string,
    bio?: string,
    group?: string,
    isAdmin?: boolean,
    createdAt?: string,
    authProvider?: string
}