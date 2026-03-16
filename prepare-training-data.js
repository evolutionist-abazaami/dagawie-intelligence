#!/usr/bin/env node

/**
 * Satellite Analysis Fine-tuning Data Preparation Script
 * Combines training examples into OpenAI fine-tuning format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trainingFiles = [
  'training-data-deforestation.json',
  'training-data-flood.json',
  'training-data-drought.json'
];

const trainingData = [];

// Load all training examples
trainingFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    trainingData.push(data);
  } catch (error) {
    console.error(`Error loading ${file}:`, error.message);
  }
});

// Validate training data format
trainingData.forEach((example, index) => {
  if (!example.messages || !Array.isArray(example.messages)) {
    console.error(`Invalid format in training example ${index}`);
    return;
  }

  const messages = example.messages;
  if (messages.length < 3) {
    console.error(`Training example ${index} needs at least system, user, and assistant messages`);
    return;
  }

  // Validate message roles
  const roles = messages.map(m => m.role);
  if (!roles.includes('system') || !roles.includes('user') || !roles.includes('assistant')) {
    console.error(`Training example ${index} missing required message roles`);
    return;
  }
});

console.log(`Loaded ${trainingData.length} training examples`);

// Write combined training data
const outputFile = path.join(__dirname, 'satellite-analysis-training.jsonl');
const outputStream = fs.createWriteStream(outputFile);

trainingData.forEach(example => {
  outputStream.write(JSON.stringify(example) + '\n');
});

outputStream.end();
console.log(`Training data written to ${outputFile}`);

// Instructions for fine-tuning
console.log('\n=== OpenAI Fine-tuning Instructions ===');
console.log('1. Upload the training file to OpenAI:');
console.log(`   openai api files.create -f ${outputFile} -p "fine-tune"`);
console.log('2. Start fine-tuning job:');
console.log('   openai api fine_tunes.create -t <file-id> -m gpt-3.5-turbo');
console.log('3. Monitor progress:');
console.log('   openai api fine_tunes.follow -i <fine-tune-id>');
console.log('4. Update the Supabase function with the fine-tuned model ID');