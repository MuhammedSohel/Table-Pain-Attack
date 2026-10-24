import { PenDefinition } from '../types';

export const PENS: Record<string, PenDefinition> = {
  ballpoint: {
    id: 'ballpoint',
    name: 'Classic Ballpoint',
    tagline: 'Standard Issue Schoolyard Legend',
    mass: 1.0,
    agility: 1.1,
    friction: 0.978, // good roll
    restitution: 0.8,
    length: 120,
    radius: 9,
    primaryColor: '#F5E8CC', // cream barrel
    accentColor: '#3568F5', // cobalt blue cap/grip
    tipColor: '#E2E8F0', // silver metal cone
    inkColor: '#3568F5', // cobalt ink
    clipColor: '#3568F5',
    description: 'The golden ratio of weight, speed, and rebound. Unlocks high-velocity ricochets.'
  },
  gel: {
    id: 'gel',
    name: 'Heavy Gel Pen',
    tagline: 'High-Impact Knockdown Battering Ram',
    mass: 1.5,
    agility: 0.85,
    friction: 0.965, // heavier friction
    restitution: 0.65,
    length: 130,
    radius: 11,
    primaryColor: '#1A2130', // dark navy rubberized barrel
    accentColor: '#FF7138', // electric orange accent ring
    tipColor: '#94A3B8', // gunmetal tip
    inkColor: '#FF7138', // orange ink
    clipColor: '#E2E8F0',
    description: 'Dense tungsten-weighted body. Shrugs off incoming hits and sends rivals flying.'
  },
  highlighter: {
    id: 'highlighter',
    name: 'Chunky Highlighter',
    tagline: 'Wide Surface Drift & Edge Defense',
    mass: 1.25,
    agility: 0.95,
    friction: 0.952, // higher table friction, stops quickly
    restitution: 0.5,
    length: 105,
    radius: 15,
    primaryColor: '#FFD600', // vivid fluorescent yellow
    accentColor: '#A6AD75', // olive grip ring
    tipColor: '#84CC16', // neon chisel tip
    inkColor: '#EAB308', // yellow ink trail
    clipColor: '#101522',
    description: 'Thick aerodynamic profile. Broad sweep area catches opponents with massive leverage.'
  }
};
