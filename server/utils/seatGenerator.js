export const generateSeats = () => {
  const seats = [];
  const rows = 'ABCDEFGHIJ'.split('');
  const seatsPerRow = 12;
  const spacingX = 40;
  const spacingY = 36;
  const startX = 60;
  const startY = 80;

  rows.forEach((row, rowIndex) => {
    for (let i = 1; i <= seatsPerRow; i += 1) {
      const id = `${row}${i}`;
      const aisleOffset = i > 6 ? 20 : 0;
      seats.push({
        id,
        x: startX + (i - 1) * spacingX + aisleOffset,
        y: startY + rowIndex * spacingY,
        status: 'available',
        lockedBy: null,
        lockedUntil: null,
      });
    }
  });

  return seats;
};
