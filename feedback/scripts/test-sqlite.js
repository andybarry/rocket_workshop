import FeedbackDB from '../database/db.js';

const db = new FeedbackDB();

// Test data
const testFeedback = {
  date: "1/15/2025",
  "workshop-location": "Test Location",
  "had-fun": "Strongly Agree",
  "favorite-part": "Testing SQLite",
  "challenged-appropriately": "Agree"
};

console.log('🧪 Testing SQLite operations...');

try {
  // Test insert
  const result = db.insertFeedback('AI', testFeedback);
  console.log('✅ Insert test passed:', result);

  // Test select
  const feedbacks = db.getFeedbackByWorkshop('AI');
  console.log('✅ Select test passed:', feedbacks.length, 'records');

  // Test stats
  const stats = db.getStats();
  console.log('✅ Stats test passed:', stats);

  // Test delete
  const deleted = db.deleteFeedback(result.id, 'AI');
  console.log('✅ Delete test passed:', deleted);

  // Test getAllFeedback
  const allFeedback = db.getAllFeedback();
  console.log('✅ GetAllFeedback test passed:', Object.keys(allFeedback).length, 'workshop types');

  console.log('🎉 All tests passed!');
} catch (error) {
  console.error('❌ Test failed:', error);
} finally {
  db.close();
}
