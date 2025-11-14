import ParallaxScrollView from '@/components/parallax-scroll-view';
import ProgressBar from '@/components/ProgressBar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TopicCategory } from '@/server/data/topics.types';
import { getCategories } from '@/utilities/topicsLoader';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type SelectedTopics = Set<string>;

const CARD_WIDTH = 200;
const CARD_GAP = 16;
const SCROLL_INTERVAL = 500;
const CARDS_TO_SHOW = 7;

export default function SubjectsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [selectedTopics, setSelectedTopics] = useState<SelectedTopics>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const dropdownScrollViewRef = useRef<ScrollView>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);
  const isDraggingRef = useRef(false);
  const containerWidthRef = useRef(0);

  const categories = getCategories();
  const backgroundColor = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;

  const visibleCards = CARDS_TO_SHOW;
  const containerWidth = CARDS_TO_SHOW * (CARD_WIDTH + CARD_GAP) - CARD_GAP;

  const circularCategories = [...categories, ...categories, ...categories];
  const startIndex = categories.length;
  const isJumpingRef = useRef(false);

  useEffect(() => {
    if (!isRotating || categories.length === 0) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const rotate = () => {
      if (isJumpingRef.current) return;
      
      currentIndexRef.current = currentIndexRef.current + 1;
      const offsetX = currentIndexRef.current * (CARD_WIDTH + CARD_GAP);
      
      if (currentIndexRef.current >= categories.length * 2 - visibleCards) {
        isJumpingRef.current = true;
        currentIndexRef.current = categories.length + (currentIndexRef.current - categories.length * 2);
        scrollViewRef.current?.scrollTo({
          x: currentIndexRef.current * (CARD_WIDTH + CARD_GAP),
          animated: false,
        });
        setTimeout(() => {
          isJumpingRef.current = false;
        }, 150);
      } else {
        scrollViewRef.current?.scrollTo({
          x: offsetX,
          animated: true,
        });
      }
    };

    scrollIntervalRef.current = setInterval(rotate, SCROLL_INTERVAL);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isRotating, categories.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const initialOffset = startIndex * (CARD_WIDTH + CARD_GAP);
      scrollViewRef.current?.scrollTo({ x: initialOffset, animated: false });
      currentIndexRef.current = startIndex;
    }, 100);
    return () => clearTimeout(timer);
  }, [startIndex]);

  const handleContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    containerWidthRef.current = width;
  };

  const handleScroll = (event: any) => {
    if (isJumpingRef.current) return;
    
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = CARD_WIDTH + CARD_GAP;
    const index = Math.round(offsetX / cardWidth);
    
    if (index < categories.length * 0.5) {
      isJumpingRef.current = true;
      const newIndex = index + categories.length;
      currentIndexRef.current = newIndex;
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          x: newIndex * cardWidth,
          animated: false,
        });
        setTimeout(() => {
          isJumpingRef.current = false;
        }, 100);
      });
    }
    else if (index >= categories.length * 2.5) {
      isJumpingRef.current = true;
      const newIndex = index - categories.length;
      currentIndexRef.current = newIndex;
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          x: newIndex * cardWidth,
          animated: false,
        });
        setTimeout(() => {
          isJumpingRef.current = false;
        }, 100);
      });
    } else {
      currentIndexRef.current = index;
    }
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = CARD_WIDTH + CARD_GAP;
    const nearestIndex = Math.round(offsetX / cardWidth);
    const snapOffset = nearestIndex * cardWidth;
    
    if (Math.abs(offsetX - snapOffset) > 5) {
      scrollViewRef.current?.scrollTo({
        x: snapOffset,
        animated: true,
      });
      currentIndexRef.current = nearestIndex;
    }
  };

  const handleEdgeHover = () => {
    if (Platform.OS === 'web') {
      setIsRotating(true);
    }
  };

  const handleEdgeLeave = () => {
    if (Platform.OS === 'web') {
      setIsRotating(false);
    }
  };

  const handleTouchStart = () => {
    if (Platform.OS !== 'web') {
      isDraggingRef.current = true;
      setTimeout(() => {
        if (isDraggingRef.current) {
          setIsRotating(true);
        }
      }, 200);
    }
  };

  const handleTouchEnd = () => {
    if (Platform.OS !== 'web') {
      isDraggingRef.current = false;
      setTimeout(() => setIsRotating(false), 800);
    }
  };

  const handleScrollEndCombined = (event: any) => {
    handleScrollEnd(event);
    if (Platform.OS !== 'web') {
      handleTouchEnd();
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const toggleCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const allTopicIds = category.topics.map(t => t.id);
    const allSelected = allTopicIds.every(id => selectedTopics.has(id));

    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        allTopicIds.forEach(id => newSet.delete(id));
      } else {
        allTopicIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isCategoryFullySelected = (category: TopicCategory): boolean => {
    return category.topics.every(topic => selectedTopics.has(topic.id));
  };

  const isCategoryPartiallySelected = (category: TopicCategory): boolean => {
    const selectedCount = category.topics.filter(topic => selectedTopics.has(topic.id)).length;
    return selectedCount > 0 && selectedCount < category.topics.length;
  };

  const getSelectedTopicsSummary = (): string => {
    if (selectedTopics.size === 0) return 'No topics selected';
    if (selectedTopics.size === 1) return '1 topic selected';
    return `${selectedTopics.size} topics selected`;
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8F0FE', dark: '#0F172A' }}
      headerImage={<View />}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Subjects</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select topics to focus your practice
          </ThemedText>
        </ThemedView>

        {/* Dropdown Modal */}
        <Modal
          visible={dropdownOpen}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setDropdownOpen(false);
            setSelectedCategoryId(null);
            setExpandedCategories(new Set());
          }}
          onShow={() => {
            if (selectedCategoryId && dropdownScrollViewRef.current) {
              const categoryIndex = categories.findIndex(c => c.id === selectedCategoryId);
              if (categoryIndex >= 0) {
                const scrollPosition = categoryIndex * 80;
                setTimeout(() => {
                  dropdownScrollViewRef.current?.scrollTo({
                    y: scrollPosition,
                    animated: true,
                  });
                }, 100);
              }
            }
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setDropdownOpen(false)}
          >
          <Pressable
            style={[styles.modalContent, { backgroundColor }]}
            onPress={(e) => e.stopPropagation()}
          >
              <ThemedView style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Select Topics
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setDropdownOpen(false)}
                  style={styles.closeButton}
                >
                  <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <ScrollView
                ref={dropdownScrollViewRef}
                style={styles.dropdownScrollView}
                contentContainerStyle={styles.dropdownContent}
                showsVerticalScrollIndicator={true}
              >
                {(selectedCategoryId 
                  ? categories.filter(c => c.id === selectedCategoryId)
                  : categories
                ).map((category) => {
                  const expanded = expandedCategories.has(category.id);
                  const fullySelected = isCategoryFullySelected(category);
                  const partiallySelected = isCategoryPartiallySelected(category);

                  return (
                    <ThemedView key={category.id} style={styles.categoryContainer}>
                      <View style={styles.categoryHeader}>
                        <TouchableOpacity
                          style={styles.checkboxContainer}
                          onPress={() => toggleCategory(category.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              fullySelected && styles.checkboxChecked,
                              partiallySelected && styles.checkboxPartial
                            ]}
                          >
                            {fullySelected && <View style={styles.checkmark} />}
                            {partiallySelected && <View style={styles.checkmarkPartial} />}
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.categoryNameContainer}
                          onPress={() => toggleCategoryExpansion(category.id)}
                          activeOpacity={0.7}
                        >
                          <ThemedText style={styles.categoryName}>
                            {category.name}
                          </ThemedText>
                          <ThemedText style={styles.topicCount}>
                            ({category.topics.length})
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.expandButton}
                          onPress={() => toggleCategoryExpansion(category.id)}
                          activeOpacity={0.7}
                        >
                          <ThemedText style={styles.expandButtonText}>
                            {expanded ? '▲' : '▼'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>

                      {expanded && (
                        <ThemedView style={styles.topicsList}>
                          {category.topics.map((topic) => {
                            const isSelected = selectedTopics.has(topic.id);
                            return (
                              <TouchableOpacity
                                key={topic.id}
                                style={[
                                  styles.topicItem,
                                  isSelected && styles.topicItemSelected
                                ]}
                                onPress={() => toggleTopic(topic.id)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.checkboxContainer}>
                                  <View
                                    style={[
                                      styles.checkbox,
                                      styles.checkboxSmall,
                                      isSelected && styles.checkboxChecked
                                    ]}
                                  >
                                    {isSelected && <View style={styles.checkmark} />}
                                  </View>
                                </View>
                                <ThemedText
                                  style={[
                                    styles.topicName,
                                    isSelected && styles.topicNameSelected
                                  ]}
                                >
                                  {topic.name}
                                </ThemedText>
                              </TouchableOpacity>
                            );
                          })}
                        </ThemedView>
                      )}
                    </ThemedView>
                  );
                })}
              </ScrollView>

              <ThemedView style={styles.modalFooter}>
                <ThemedText style={styles.footerText}>
                  {getSelectedTopicsSummary()}
                </ThemedText>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => {
                    setDropdownOpen(false);
                    setSelectedCategoryId(null);
                    setExpandedCategories(new Set());
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.doneButtonText}>Done</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Main Content Area - Topics Carousel */}
        <ThemedView style={styles.mainContent}>
          <ThemedView style={styles.carouselHeader}>
            <ThemedText type="subtitle" style={styles.carouselTitle}>
              My Topics
            </ThemedText>
          </ThemedView>

          <View style={styles.carouselWrapper}>
            {/* Left edge zone for hover detection */}
            {Platform.OS === 'web' && (
              <View
                style={[
                  styles.edgeZone,
                  styles.edgeZoneLeft,
                  Platform.OS === 'web' && {
                    // @ts-ignore - web-only CSS
                    pointerEvents: 'auto',
                  }
                ]}
                // @ts-ignore - web-only props
                onMouseEnter={handleEdgeHover}
                onMouseLeave={handleEdgeLeave}
                onStartShouldSetResponder={() => false}
                onMoveShouldSetResponder={() => false}
              >
                <View style={styles.edgeIndicator}>
                  <ThemedText style={styles.edgeIndicatorText}>◀ Hover</ThemedText>
                </View>
              </View>
            )}
            
            <View 
              style={styles.cardsContainer}
              onLayout={handleContainerLayout}
            >
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
                style={[styles.carousel, { width: containerWidth }]}
                onScrollBeginDrag={handleTouchStart}
                onScrollEndDrag={handleScrollEndCombined}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleScrollEndCombined}
                scrollEventThrottle={16}
                snapToInterval={CARD_WIDTH + CARD_GAP}
                snapToAlignment="start"
                decelerationRate="fast"
                pagingEnabled={false}
              >
            {circularCategories.map((category, index) => {
              const fullySelected = isCategoryFullySelected(category);
              const partiallySelected = isCategoryPartiallySelected(category);
              const selectedCount = category.topics.filter(topic => selectedTopics.has(topic.id)).length;
              
              const actualCategory = categories.find(c => c.id === category.id) || category;

              return (
                <TouchableOpacity
                  key={`${category.id}-${index}`}
                  style={[
                    styles.topicCard,
                    fullySelected && styles.topicCardSelected,
                    partiallySelected && styles.topicCardPartial
                  ]}
                  onPress={() => {
                    setExpandedCategories(new Set([actualCategory.id]));
                    setSelectedCategoryId(actualCategory.id);
                    setDropdownOpen(true);
                  }}
                  activeOpacity={0.8}
                >
                  <ThemedView style={styles.cardContent}>
                    <ThemedView style={styles.cardHeader}>
                      {fullySelected && (
                        <View style={styles.selectedBadge}>
                          <ThemedText style={styles.selectedBadgeText}>✓</ThemedText>
                        </View>
                      )}
                      {partiallySelected && (
                        <View style={styles.partialBadge}>
                          <ThemedText style={styles.partialBadgeText}>
                            {selectedCount}/{category.topics.length}
                          </ThemedText>
                        </View>
                      )}
                      {!fullySelected && !partiallySelected && (
                        <TouchableOpacity
                          style={styles.selectIndicator}
                          onPress={(e) => {
                            e.stopPropagation();
                            setExpandedCategories(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(category.id)) {
                                newSet.delete(category.id);
                              } else {
                                newSet.add(category.id);
                              }
                              return newSet;
                            });
                            setDropdownOpen(true);
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <ThemedText style={styles.selectIndicatorText}>⚙ Select</ThemedText>
                        </TouchableOpacity>
                      )}
                    </ThemedView>

                    <ThemedView style={styles.cardFooter}>
                      <ThemedView style={styles.cardFooterInner}>
                        <ThemedText style={styles.cardTopicName} numberOfLines={2}>
                          {category.name}
                        </ThemedText>
                        <ThemedText style={styles.cardSubtopicsCount}>
                          {category.topics.length} subtopic{category.topics.length !== 1 ? 's' : ''}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </TouchableOpacity>
              );
            })}
              </ScrollView>
              
              {/* Mobile drag indicator */}
              {Platform.OS !== 'web' && (
                <View style={styles.mobileIndicator}>
                  <ThemedText style={styles.mobileIndicatorText}>
                    ← Drag to rotate →
                  </ThemedText>
                </View>
              )}
            </View>
            
            {/* Right edge zone for hover detection */}
            {Platform.OS === 'web' && (
              <View
                style={[
                  styles.edgeZone,
                  styles.edgeZoneRight,
                  Platform.OS === 'web' && {
                    // @ts-ignore - web-only CSS
                    pointerEvents: 'auto',
                  }
                ]}
                // @ts-ignore - web-only props
                onMouseEnter={handleEdgeHover}
                onMouseLeave={handleEdgeLeave}
                onStartShouldSetResponder={() => false}
                onMoveShouldSetResponder={() => false}
              >
                <View style={styles.edgeIndicator}>
                  <ThemedText style={styles.edgeIndicatorText}>Hover ▶</ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Topic Percentage Selection Section */}
          <ThemedView style={styles.percentageSection}>
            <ThemedText type="subtitle" style={styles.percentageTitle}>
              Topic Percentage Selection
            </ThemedText>
            
            <View style={styles.percentageGrid}>
              {categories.map((category) => {
                const selectedCount = category.topics.filter(topic => selectedTopics.has(topic.id)).length;
                const totalCount = category.topics.length;
                const percentage = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;
                
                const colors = [
                  '#0a7ea4',
                  '#10b981',
                  '#f59e0b',
                  '#ef4444',
                  '#8b5cf6',
                  '#ec4899',
                  '#06b6d4',
                  '#84cc16',
                ];
                const categoryColor = colors[category.id.charCodeAt(0) % colors.length];
                
                return (
                  <View key={category.id} style={styles.percentageCardWrapper}>
                    <View style={[styles.categorySquare, { backgroundColor: categoryColor }]} />
                    <ThemedView style={[
                      styles.percentageCard,
                      percentage > 0 && styles.percentageCardSelected
                    ]}>
                      <ThemedText 
                        style={[
                          styles.categoryNameText,
                          selectedCount > 0 && styles.categoryNameTextSelected
                        ]} 
                        numberOfLines={2}
                      >
                        {category.name}
                      </ThemedText>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBarWrapper}>
                          <View style={{ flex: 1 }}>
                            <ProgressBar
                              value={percentage}
                              color={categoryColor}
                              width="100%"
                              height={6}
                              backgroundColor={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                              borderRadius={3}
                              useLabel={false}
                              labelColor={textColor}
                            />
                          </View>
                          <ThemedText style={styles.percentageLabel}>
                            {Math.round(percentage)}%
                          </ThemedText>
                        </View>
                      </View>
                    </ThemedView>
                  </View>
                );
              })}
            </View>
          </ThemedView>

          <ThemedView style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              {selectedTopics.size === 0
                ? 'Tap on a topic card above or use the dropdown to select specific topics for practice.'
                : `You have selected ${selectedTopics.size} topic${selectedTopics.size !== 1 ? 's' : ''} across ${categories.filter(c => c.topics.some(t => selectedTopics.has(t.id))).length} categor${categories.filter(c => c.topics.some(t => selectedTopics.has(t.id))).length !== 1 ? 'ies' : 'y'}.`}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#687076',
  },
  dropdownScrollView: {
    flex: 1,
  },
  dropdownContent: {
    padding: 16,
    paddingBottom: 8,
  },
  categoryContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(128, 128, 128, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  topicCount: {
    fontSize: 14,
    opacity: 0.6,
    marginLeft: 8,
  },
  expandButton: {
    padding: 4,
  },
  expandButtonText: {
    fontSize: 12,
    opacity: 0.6,
  },
  topicsList: {
    paddingLeft: 16,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.02)',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  topicItemSelected: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  topicName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  topicNameSelected: {
    fontWeight: '500',
    color: '#0a7ea4',
  },
  checkboxContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#687076',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSmall: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
  },
  checkboxChecked: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  checkboxPartial: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  checkmark: {
    width: 6,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  checkmarkPartial: {
    width: 8,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    gap: 16,
  },
  carouselHeader: {
    marginBottom: 12,
  },
  carouselTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  carouselWrapper: {
    marginHorizontal: -16,
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
  },
  cardsContainer: {
    overflow: 'hidden',
    position: 'relative',
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: {
    height: 260,
  },
  edgeZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    zIndex: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  edgeZoneLeft: {
    left: 0,
  },
  edgeZoneRight: {
    right: 0,
  },
  edgeIndicator: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(10, 126, 164, 0.3)',
    opacity: 0.7,
  },
  edgeIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  mobileIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
    marginTop: 8,
  },
  mobileIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0a7ea4',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(10, 126, 164, 0.2)',
    opacity: 0.8,
  },
  carouselContainer: {
    paddingVertical: 8,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCard: {
    width: 200,
    height: 240,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicCardSelected: {
    backgroundColor: 'rgba(10, 126, 164, 0.08)',
    borderColor: 'rgba(10, 126, 164, 0.3)',
    borderWidth: 2,
  },
  topicCardPartial: {
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
    borderColor: 'rgba(10, 126, 164, 0.2)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  partialBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partialBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(10, 126, 164, 0.3)',
  },
  selectIndicatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  cardFooter: {
    marginTop: 'auto',
    height: '50%',
  },
  cardFooterInner: {
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.15)',
    height: '100%',
    justifyContent: 'space-between',
  },
  cardTopicName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
    flex: 1,
  },
  cardSubtopicsCount: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '500',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(10, 126, 164, 0.2)',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  percentageSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  percentageTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  percentageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  percentageCardWrapper: {
    width: '48%',
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  categorySquare: {
    width: 40,
    height: 40,
    borderRadius: 6,
    flexShrink: 0,
    marginRight: 8,
  },
  percentageCard: {
    flex: 1,
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
    height: 40,
    justifyContent: 'center',
  },
  percentageCardSelected: {
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
    borderColor: 'rgba(10, 126, 164, 0.3)',
    borderWidth: 2,
  },
  categoryNameText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 14,
  },
  categoryNameTextSelected: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 2,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageLabel: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
    marginLeft: 8,
  },
});
