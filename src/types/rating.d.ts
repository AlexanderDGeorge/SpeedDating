export type Rating = {
    id: string,
    createdAt: string,
    userId: string,
    partnerId: string,
    eventId: string
    rating: 'not-interested' | 'maybe' | 'interested',
    notes?: string
}