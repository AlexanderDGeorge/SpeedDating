export type User = {
    id: string,
    name: string,
    email: string,
    age: number,
    gender: string,
    bio?: string,
    group?: string,
    isAdmin?: boolean,
    createdAt?: string,
    authProvider?: string
}