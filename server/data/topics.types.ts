/**
 * Type definitions for the topics data structure
 */

export interface Topic {
  id: string;
  name: string;
}

export interface TopicCategory {
  id: string;
  name: string;
  topics: Topic[];
}

export interface TopicsData {
  categories: TopicCategory[];
}

/**
 * Helper function to get all topics as a flat list
 */
export function getAllTopics(categories: TopicCategory[]): Topic[] {
  return categories.flatMap(category => 
    category.topics.map(topic => ({
      ...topic,
      categoryId: category.id,
      categoryName: category.name
    }))
  );
}

/**
 * Helper function to find a topic by ID
 */
export function findTopicById(
  categories: TopicCategory[],
  topicId: string
): { topic: Topic; category: TopicCategory } | null {
  for (const category of categories) {
    const topic = category.topics.find(t => t.id === topicId);
    if (topic) {
      return { topic, category };
    }
  }
  return null;
}

/**
 * Helper function to get topics by category ID
 */
export function getTopicsByCategoryId(
  categories: TopicCategory[],
  categoryId: string
): Topic[] {
  const category = categories.find(c => c.id === categoryId);
  return category ? category.topics : [];
}

