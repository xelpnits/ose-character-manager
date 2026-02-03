import React from 'react';
import { ItemCategory, OSEClass } from '../types';
import {
  Box,
  Sword,
  Shield,
  FlaskConical,
  Scroll,
  Gem,
  Cross,
  Hammer,
  Leaf,
  Footprints,
  Wand2,
  Key,
  Skull,
} from 'lucide-react';

/**
 * Returns the Lucide icon component associated with an item category.
 */
export const getCategoryIcon = (cat?: ItemCategory, className = 'w-3 h-3') => {
  switch (cat) {
    case ItemCategory.Weapon:
      return React.createElement(Sword, { className });
    case ItemCategory.Armor:
      return React.createElement(Shield, { className });
    case ItemCategory.Potion:
      return React.createElement(FlaskConical, { className });
    case ItemCategory.Scroll:
      return React.createElement(Scroll, { className });
    case ItemCategory.Treasure:
      return React.createElement(Gem, { className });
    default:
      return React.createElement(Box, { className });
  }
};

/**
 * Returns a specific icon for the OSE Class.
 */
export const getClassIcon = (cls: OSEClass, className = 'w-6 h-6') => {
  switch (cls) {
    case OSEClass.Cleric:
      return React.createElement(Cross, { className }); // Representing holy symbol
    case OSEClass.Dwarf:
      return React.createElement(Hammer, { className });
    case OSEClass.Elf:
      return React.createElement(Leaf, { className }); // Or a spell/sword combo
    case OSEClass.Fighter:
      return React.createElement(Sword, { className });
    case OSEClass.Halfling:
      return React.createElement(Footprints, { className });
    case OSEClass.MagicUser:
      return React.createElement(Wand2, { className });
    case OSEClass.Thief:
      return React.createElement(Key, { className });
    default:
      return React.createElement(Skull, { className });
  }
};
