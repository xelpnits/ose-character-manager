import type { Container } from '../../types';

/**
 * Calculates the total weight of items in a specific container.
 */
export const calculateContainerWeight = (container: Container): number => {
  return container.items.reduce((acc, i) => acc + i.weight * i.count, 0);
};

/**
 * Calculates total item count in a list of containers.
 */
export const calculateTotalItems = (containers: Container[]): number => {
  return containers.reduce(
    (acc, c) => acc + c.items.reduce((iAcc, item) => iAcc + item.count, 0),
    0
  );
};

/**
 * Calculates total weight across all containers.
 */
export const calculateTotalWeight = (containers: Container[]): number => {
  return containers.reduce((acc, c) => acc + calculateContainerWeight(c), 0);
};
