// Quick test to verify our formatDate logic
const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
};

// Test cases
console.log('Testing formatDate function:');
console.log('Valid ISO string:', formatDate('2024-01-01T00:00:00.000Z'));
console.log('Valid Date object:', formatDate(new Date('2024-01-01')));
console.log('Null date:', formatDate(null));
console.log('Undefined date:', formatDate(undefined));
console.log('Invalid string:', formatDate('invalid-date'));
console.log('Empty string:', formatDate(''));
console.log('Valid recent date:', formatDate('2025-09-05T19:11:50.826Z'));