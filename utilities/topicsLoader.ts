/**
 * Load topics data for the app
 * This file loads the topics JSON and provides it to components
 */

import { TopicCategory, TopicsData } from '../server/data/topics.types';

// Use require for better React Native compatibility
const topicsData = require('../server/data/topics.json');

export const topics: TopicsData = topicsData as TopicsData;

export const getCategories = (): TopicCategory[] => {
  return topics.categories;
};

export const getCategoryNames = (): string[] => {
  return topics.categories.map((c) => c.name);
};

export const getAllTopicIds = (): string[] => {
  return topics.categories.flatMap(category => 
    category.topics.map(topic => topic.id)
  );
};

export const getTopicById = (topicId: string): { topic: { id: string; name: string }; category: TopicCategory } | null => {
  for (const category of topics.categories) {
    const topic = category.topics.find(t => t.id === topicId);
    if (topic) {
      return { topic, category };
    }
  }
  return null;
};

