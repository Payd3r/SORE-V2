import { TimelineMemory } from "@/lib/timeline-system";
import { faker } from '@faker-js/faker';

const createMockMemory = (index: number): TimelineMemory => {
    const date = faker.date.between({ from: '2023-01-01T00:00:00.000Z', to: '2023-12-31T23:59:59.999Z' });
    return {
        id: faker.string.uuid(),
        title: faker.lorem.sentence(5),
        description: faker.lorem.paragraph(),
        date,
        location: faker.location.city(),
        mood: faker.helpers.arrayElement(['happy', 'sad', 'excited', 'calm', 'neutral']),
        category: faker.helpers.arrayElement(['travel', 'work', 'personal', 'food']),
        author: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
        },
        images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
            id: faker.string.uuid(),
            filename: `${faker.system.fileName()}.jpg`,
            thumbnailPath: `https://picsum.photos/seed/${faker.string.uuid()}/400/300`,
        })),
        moments: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
            id: faker.string.uuid(),
            status: 'completed',
        })),
        ideas: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
            id: faker.string.uuid(),
            title: faker.lorem.sentence(3),
            status: 'pending',
        })),
    };
};

export const mockMemories = (count: number): TimelineMemory[] => {
    return Array.from({ length: count }, (_, index) => createMockMemory(index));
}; 