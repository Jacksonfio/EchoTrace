import type { Evidence, ExtractedData, Entity, TimelineEvent, Contradiction, Relationship } from '../../../shared/types';
import fs from 'fs';

// Common patterns to extract from text evidence
const TIME_PATTERN = /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\b/g;
const DATE_PATTERN = /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})\b/g;
const PLATE_PATTERN = /\b[A-Z]{2,3}[- ]?\d{1,4}[A-Z]{0,2}\b/g;
const PHONE_PATTERN = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
const AGE_PATTERN = /\b(\d{2,3})[- ]?years?[- ]?old\b|\baged? (\d{2,3})\b|\b(\d{2,3})[- ]?yr[- ]?old\b/gi;

// Colors commonly mentioned
const COLORS = [
  'red', 'blue', 'green', 'black', 'white', 'gray', 'grey', 'silver',
  'dark gray', 'dark grey', 'light gray', 'light grey', 'dark blue',
  'navy', 'beige', 'brown', 'gold', 'yellow', 'orange', 'purple',
];

// Vehicle types
const VEHICLE_TYPES = [
  'SUV', 'sedan', 'truck', 'van', 'motorcycle', 'bike', 'car',
  'pickup', 'hatchback', 'coupe', 'convertible', 'minivan',
];

function readEvidenceText(evidence: Evidence[]): string {
  const parts: string[] = [];
  for (const ev of evidence) {
    parts.push(ev.name || '');
    if (ev.description) parts.push(ev.description);
    // Read file content for text evidence
    if (ev.filePath && ev.mimeType === 'text/plain') {
      try {
        const content = fs.readFileSync(ev.filePath, 'utf8');
        parts.push(content);
      } catch {
        // File may not exist for demo/seed data
      }
    }
  }
  return parts.join(' ');
}

export function mockAnalyze(evidence: Evidence[]): ExtractedData {
  const entities: Entity[] = [];
  const events: TimelineEvent[] = [];
  const contradictions: Contradiction[] = [];
  const relationships: Relationship[] = [];
  
  const allText = readEvidenceText(evidence);

  // Extract people (names with context clues)
  const people = extractPeople(allText);
  for (const person of people) {
    entities.push({
      id: `entity-${entities.length}`,
      type: 'Person',
      name: person.name,
      description: person.description || `Person identified in evidence analysis`,
      mentions: evidence.map(e => e.id),
      confidence: person.confidence || 0.7,
      metadata: person.metadata || {},
    });
  }

  // Extract vehicles
  const vehicles = extractVehicles(allText);
  for (const vehicle of vehicles) {
    entities.push({
      id: `entity-${entities.length}`,
      type: 'Vehicle',
      name: vehicle.name,
      description: vehicle.description || `Vehicle identified in evidence`,
      mentions: evidence.map(e => e.id),
      confidence: vehicle.confidence || 0.75,
      metadata: vehicle.metadata || {},
    });
  }

  // Extract locations
  const locations = extractLocations(allText);
  for (const loc of locations) {
    entities.push({
      id: `entity-${entities.length}`,
      type: 'Location',
      name: loc.name,
      description: loc.description || `Location mentioned in evidence`,
      mentions: evidence.map(e => e.id),
      confidence: loc.confidence || 0.8,
    });
  }

  // Extract times and build timeline events from each piece of evidence
  for (const ev of evidence) {
    const text = `${ev.name} ${ev.description || ''}`;
    const times = [...text.matchAll(TIME_PATTERN)].map(m => m[1]);
    
    if (times.length > 0) {
      events.push({
        id: `event-${events.length}`,
        time: times[0],
        description: `Evidence recorded: ${ev.name}${ev.description ? ` — ${ev.description.substring(0, 100)}` : ''}`,
        evidenceIds: [ev.id],
        entityIds: entities.length > 0 ? [entities[0].id] : [],
        confidence: 0.8,
        eventType: 'observation',
      });
    } else {
      // Generate a timestamp based on upload order
      const hour = (8 + events.length) % 12 + 1;
      const minute = (events.length * 15) % 60;
      events.push({
        id: `event-${events.length}`,
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        description: `Evidence submitted: ${ev.name}`,
        evidenceIds: [ev.id],
        entityIds: entities.length > 0 ? [entities[0].id] : [],
        confidence: 0.75,
        eventType: 'statement',
      });
    }
  }

  // Extract contradictions from conflicting descriptions
  const colorMentions = extractColorMentions(allText, evidence);
  for (const cm of colorMentions) {
    contradictions.push({
      id: `contradiction-${contradictions.length}`,
      description: cm.description,
      evidenceIds: cm.evidenceIds,
      entities: cm.entities,
      category: cm.category || 'visual',
      severity: cm.severity || 'medium',
      confidence: cm.confidence || 0.65,
    });
  }

  // Extract person description conflicts
  if (people.length >= 2) {
    const genderConflict = detectGenderConflict(allText);
    if (genderConflict) {
      contradictions.push({
        id: `contradiction-${contradictions.length}`,
        description: genderConflict.description,
        evidenceIds: genderConflict.evidenceIds,
        entities: genderConflict.entities,
        category: 'statement',
        severity: 'high',
        confidence: 0.7,
      });
    }
  }

  // Build relationships
  if (entities.length >= 2) {
    for (let i = 0; i < entities.length - 1; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        if (entities[i].type === 'Person' && entities[j].type === 'Vehicle') {
          relationships.push({
            id: `rel-${relationships.length}`,
            sourceId: entities[i].id,
            targetId: entities[j].id,
            relation: 'associated_with',
            confidence: 0.6,
            description: `${entities[i].name} associated with ${entities[j].name}`,
          });
        }
        if (entities[i].type === 'Location' && (entities[j].type === 'Vehicle' || entities[j].type === 'Person')) {
          relationships.push({
            id: `rel-${relationships.length}`,
            sourceId: entities[j].id,
            targetId: entities[i].id,
            relation: 'located_at',
            confidence: 0.7,
            description: `${entities[j].name} located at ${entities[i].name}`,
          });
        }
      }
    }
  }

  // Generate summary
  const summary = generateSummary(evidence, entities, events, contradictions);

  return { entities, events, contradictions, relationships, summary };
}

function extractPeople(text: string): Array<{
  name: string;
  description?: string;
  confidence?: number;
  metadata?: Record<string, string>;
}> {
  const people: Array<{
    name: string;
    description?: string;
    confidence?: number;
    metadata?: Record<string, string>;
  }> = [];

  // Look for "Mr/Mrs/Ms X" or "X said/mentioned/reported"
  const titlePattern = /\b(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+([A-Z][a-z]+)\b/g;
  let match;
  while ((match = titlePattern.exec(text)) !== null) {
    const name = `${match[1]} ${match[2]}`;
    if (!people.find(p => p.name === name)) {
      people.push({ name, confidence: 0.8 });
    }
  }

  // Look for "witness/witnesses/victim/driver X"
  const rolePattern = /\b(witness|victim|driver|suspect|caller|bystander|passenger)\s+(?:named|called|identified as)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi;
  while ((match = rolePattern.exec(text)) !== null) {
    const role = match[1].toLowerCase();
    const name = match[2].trim();
    if (!people.find(p => p.name === name)) {
      people.push({
        name,
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} identified in investigation`,
        confidence: 0.75,
        metadata: { role },
      });
    }
  }

  // Look for "X (age Y)" or "X, Y"
  const agePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\(age\s*(\d+)\)/g;
  while ((match = agePattern.exec(text)) !== null) {
    const name = match[1].trim();
    if (!people.find(p => p.name === name)) {
      people.push({
        name,
        metadata: { age: match[2] },
        confidence: 0.7,
      });
    }
  }

  if (people.length === 0) {
    // Default: generate witness entities from evidence context
    people.push({
      name: 'Primary Witness',
      description: 'Main witness providing evidence statements',
      confidence: 0.6,
    });
    if (text.toLowerCase().includes('victim') || text.toLowerCase().includes('injured')) {
      people.push({
        name: 'Victim',
        description: 'Person affected by the incident',
        confidence: 0.65,
      });
    }
  }

  return people;
}

function extractVehicles(text: string): Array<{
  name: string;
  description?: string;
  confidence?: number;
  metadata?: Record<string, string>;
}> {
  const vehicles: Array<{
    name: string;
    description?: string;
    confidence?: number;
    metadata?: Record<string, string>;
  }> = [];

  // Look for color + vehicle type patterns
  for (const color of COLORS) {
    for (const vtype of VEHICLE_TYPES) {
      const pattern = new RegExp(`\\b${color}\\s+${vtype}\\b`, 'gi');
      if (pattern.test(text)) {
        const name = `${color.charAt(0).toUpperCase() + color.slice(1)} ${vtype}`;
        if (!vehicles.find(v => v.name === name)) {
          vehicles.push({
            name,
            description: `${color.charAt(0).toUpperCase() + color.slice(1)} ${vtype} involved in the incident`,
            confidence: 0.85,
            metadata: { color, type: vtype },
          });
        }
      }
    }
  }

  // Look for license plates
  const plates = [...text.matchAll(PLATE_PATTERN)];
  for (const plate of plates) {
    const plateStr = plate[0].trim();
    if (!vehicles.find(v => v.metadata?.plate === plateStr)) {
      const existingName = vehicles.length > 0 ? vehicles[0].name : 'Vehicle';
      vehicles.push({
        name: `${existingName} (${plateStr})`,
        description: `Vehicle with license plate ${plateStr}`,
        confidence: 0.9,
        metadata: { plate: plateStr },
      });
    }
  }

  if (vehicles.length === 0) {
    // Check for generic vehicle mentions
    for (const vtype of VEHICLE_TYPES) {
      if (new RegExp(`\\b${vtype}\\b`, 'gi').test(text)) {
        vehicles.push({
          name: vtype,
          description: `${vtype} mentioned in evidence`,
          confidence: 0.6,
        });
        break;
      }
    }
  }

  return vehicles;
}

function extractLocations(text: string): Array<{
  name: string;
  description?: string;
  confidence?: number;
}> {
  const locations: Array<{
    name: string;
    description?: string;
    confidence?: number;
  }> = [];

  // Look for intersection patterns (X and Y, X & Y)
  const intersectionPattern = /\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:and|&|at)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:intersection|street|road|avenue|drive|boulevard|circle|way)\b/gi;
  let match;
  while ((match = intersectionPattern.exec(text)) !== null) {
    const loc = `${match[1]} & ${match[2]}`;
    if (!locations.find(l => l.name === loc)) {
      locations.push({
        name: loc,
        description: `Intersection mentioned in evidence`,
        confidence: 0.85,
      });
    }
  }

  // Look for "at the X" patterns (locations)
  const atPattern = /\bat\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Za-z]+)?)\s+(?:street|road|avenue|drive|boulevard|intersection|building|house|store|mall|park|lot|garage)\b/gi;
  while ((match = atPattern.exec(text)) !== null) {
    const loc = match[1].trim();
    if (!locations.find(l => l.name === loc)) {
      locations.push({
        name: loc,
        description: `Location mentioned in evidence`,
        confidence: 0.75,
      });
    }
  }

  if (locations.length === 0) {
    locations.push({
      name: 'Incident Location',
      description: 'Location where the incident occurred',
      confidence: 0.5,
    });
  }

  return locations;
}

function extractColorMentions(text: string, evidence: Evidence[]): Array<{
  description: string;
  evidenceIds: string[];
  entities: string[];
  category: 'visual' | 'statement' | 'temporal' | 'location' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}> {
  const results: Array<{
    description: string;
    evidenceIds: string[];
    entities: string[];
    category: 'visual' | 'statement' | 'temporal' | 'location' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }> = [];

  // Check each piece of evidence for different color descriptions of the same vehicle type
  const vehicleColorMentions: Array<{ color: string; vehicleType: string; evidenceId: string }> = [];
  
  for (const ev of evidence) {
    const evText = `${ev.name} ${ev.description || ''}`.toLowerCase();
    for (const color of COLORS) {
      for (const vtype of VEHICLE_TYPES) {
        if (evText.includes(`${color} ${vtype}`)) {
          vehicleColorMentions.push({
            color,
            vehicleType: vtype,
            evidenceId: ev.id,
          });
        }
      }
    }
  }

  // Group by vehicle type and check for color conflicts
  const byVehicleType = new Map<string, Array<{ color: string; evidenceId: string }>>();
  for (const vcm of vehicleColorMentions) {
    const key = vcm.vehicleType;
    if (!byVehicleType.has(key)) byVehicleType.set(key, []);
    byVehicleType.get(key)!.push({ color: vcm.color, evidenceId: vcm.evidenceId });
  }

  for (const [vtype, mentions] of byVehicleType.entries()) {
    const uniqueColors = [...new Set(mentions.map(m => m.color))];
    if (uniqueColors.length >= 2) {
      results.push({
        description: `Conflicting vehicle color descriptions for the ${vtype}: some evidence describes it as "${uniqueColors.join('", "')}".`,
        evidenceIds: mentions.map(m => m.evidenceId),
        entities: [`${uniqueColors[0].charAt(0).toUpperCase() + uniqueColors[0].slice(1)} ${vtype}`],
        category: 'visual',
        severity: 'high',
        confidence: 0.75,
      });
    }
  }

  // Check for time-based contradictions
  const times = [...text.matchAll(TIME_PATTERN)];
  if (times.length >= 3) {
    results.push({
      description: 'Multiple different timestamps mentioned across evidence — may indicate timeline inconsistencies.',
      evidenceIds: evidence.map(e => e.id),
      entities: [],
      category: 'temporal',
      severity: 'medium',
      confidence: 0.5,
    });
  }

  return results;
}

function detectGenderConflict(text: string): {
  description: string;
  evidenceIds: string[];
  entities: string[];
} | null {
  const lowerText = text.toLowerCase();
  const hasMale = /\b(he|him|his|man|male|boy|gentleman)\b/.test(lowerText);
  const hasFemale = /\b(she|her|hers|woman|female|girl|lady)\b/.test(lowerText);
  
  if (hasMale && hasFemale) {
    return {
      description: 'Evidence contains both male and female references — possible gender contradiction in witness descriptions.',
      evidenceIds: [],
      entities: ['Unidentified Person'],
    };
  }
  return null;
}

function generateSummary(
  evidence: Evidence[],
  entities: Entity[],
  events: TimelineEvent[],
  contradictions: Contradiction[],
): string {
  const people = entities.filter(e => e.type === 'Person');
  const vehicles = entities.filter(e => e.type === 'Vehicle');
  const locations = entities.filter(e => e.type === 'Location');
  
  let summary = `Analysis of ${evidence.length} evidence item(s)`;
  
  if (people.length > 0) {
    summary += ` identified ${people.length} person(s)`;
  }
  if (vehicles.length > 0) {
    summary += `, ${vehicles.length} vehicle(s)`;
  }
  if (locations.length > 0) {
    summary += `, ${locations.length} location(s)`;
  }
  
  summary += `. Extracted ${events.length} timeline event(s)`;
  
  if (contradictions.length > 0) {
    summary += ` and detected ${contradictions.length} potential contradiction(s)`;
  }
  
  summary += '. Analysis performed in offline mode (Gemini API rate limit reached).';
  
  return summary;
}
