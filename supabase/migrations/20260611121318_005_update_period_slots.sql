-- Add day_of_week to period_slots to support different timings per day
ALTER TABLE period_slots ADD COLUMN IF NOT EXISTS day_of_week integer DEFAULT 0 CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Clear existing period slots
DELETE FROM period_slots;

-- Monday to Friday timings (10:15 AM to 4:00 PM)
-- First 4 periods: 45 minutes each
-- Lunch: 45 minutes  
-- After lunch periods: 40 minutes each

INSERT INTO period_slots (period_number, day_of_week, start_time, end_time, is_break, break_name, created_at, updated_at) VALUES
-- Monday (0) through Friday (4)
-- Period 1: 10:15 - 11:00 (45 min)
(1, 0, '10:15', '11:00', false, NULL, NOW(), NOW()),
(1, 1, '10:15', '11:00', false, NULL, NOW(), NOW()),
(1, 2, '10:15', '11:00', false, NULL, NOW(), NOW()),
(1, 3, '10:15', '11:00', false, NULL, NOW(), NOW()),
(1, 4, '10:15', '11:00', false, NULL, NOW(), NOW()),
-- Period 2: 11:00 - 11:45 (45 min)
(2, 0, '11:00', '11:45', false, NULL, NOW(), NOW()),
(2, 1, '11:00', '11:45', false, NULL, NOW(), NOW()),
(2, 2, '11:00', '11:45', false, NULL, NOW(), NOW()),
(2, 3, '11:00', '11:45', false, NULL, NOW(), NOW()),
(2, 4, '11:00', '11:45', false, NULL, NOW(), NOW()),
-- Period 3: 11:45 - 12:30 (45 min)
(3, 0, '11:45', '12:30', false, NULL, NOW(), NOW()),
(3, 1, '11:45', '12:30', false, NULL, NOW(), NOW()),
(3, 2, '11:45', '12:30', false, NULL, NOW(), NOW()),
(3, 3, '11:45', '12:30', false, NULL, NOW(), NOW()),
(3, 4, '11:45', '12:30', false, NULL, NOW(), NOW()),
-- Period 4: 12:30 - 1:15 (45 min)
(4, 0, '12:30', '13:15', false, NULL, NOW(), NOW()),
(4, 1, '12:30', '13:15', false, NULL, NOW(), NOW()),
(4, 2, '12:30', '13:15', false, NULL, NOW(), NOW()),
(4, 3, '12:30', '13:15', false, NULL, NOW(), NOW()),
(4, 4, '12:30', '13:15', false, NULL, NOW(), NOW()),
-- Lunch Break: 1:15 - 2:00 (45 min)
(5, 0, '13:15', '14:00', true, 'Lunch Break', NOW(), NOW()),
(5, 1, '13:15', '14:00', true, 'Lunch Break', NOW(), NOW()),
(5, 2, '13:15', '14:00', true, 'Lunch Break', NOW(), NOW()),
(5, 3, '13:15', '14:00', true, 'Lunch Break', NOW(), NOW()),
(5, 4, '13:15', '14:00', true, 'Lunch Break', NOW(), NOW()),
-- Period 6: 2:00 - 2:40 (40 min)
(6, 0, '14:00', '14:40', false, NULL, NOW(), NOW()),
(6, 1, '14:00', '14:40', false, NULL, NOW(), NOW()),
(6, 2, '14:00', '14:40', false, NULL, NOW(), NOW()),
(6, 3, '14:00', '14:40', false, NULL, NOW(), NOW()),
(6, 4, '14:00', '14:40', false, NULL, NOW(), NOW()),
-- Period 7: 2:40 - 3:20 (40 min)
(7, 0, '14:40', '15:20', false, NULL, NOW(), NOW()),
(7, 1, '14:40', '15:20', false, NULL, NOW(), NOW()),
(7, 2, '14:40', '15:20', false, NULL, NOW(), NOW()),
(7, 3, '14:40', '15:20', false, NULL, NOW(), NOW()),
(7, 4, '14:40', '15:20', false, NULL, NOW(), NOW()),
-- Period 8: 3:20 - 4:00 (40 min)
(8, 0, '15:20', '16:00', false, NULL, NOW(), NOW()),
(8, 1, '15:20', '16:00', false, NULL, NOW(), NOW()),
(8, 2, '15:20', '16:00', false, NULL, NOW(), NOW()),
(8, 3, '15:20', '16:00', false, NULL, NOW(), NOW()),
(8, 4, '15:20', '16:00', false, NULL, NOW(), NOW()),

-- Saturday (5) timings (6:15 AM to 11:30 AM)
-- Period 1: 6:15 - 7:00 (45 min)
(1, 5, '06:15', '07:00', false, NULL, NOW(), NOW()),
-- Period 2: 7:00 - 7:45 (45 min)
(2, 5, '07:00', '07:45', false, NULL, NOW(), NOW()),
-- Period 3: 7:45 - 8:30 (45 min)
(3, 5, '07:45', '08:30', false, NULL, NOW(), NOW()),
-- Period 4: 8:30 - 9:15 (45 min)
(4, 5, '08:30', '09:15', false, NULL, NOW(), NOW()),
-- Short Break: 9:15 - 9:30 (15 min)
(5, 5, '09:15', '09:30', true, 'Short Break', NOW(), NOW()),
-- Period 6: 9:30 - 10:10 (40 min)
(6, 5, '09:30', '10:10', false, NULL, NOW(), NOW()),
-- Period 7: 10:10 - 10:50 (40 min)
(7, 5, '10:10', '10:50', false, NULL, NOW(), NOW()),
-- Period 8: 10:50 - 11:30 (40 min)
(8, 5, '10:50', '11:30', false, NULL, NOW(), NOW());