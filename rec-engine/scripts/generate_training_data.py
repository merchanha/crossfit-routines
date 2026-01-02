#!/usr/bin/env python3
"""
Generate training data for ML model
Creates realistic workout history with both liked and not-liked scenarios
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import random
import uuid

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import get_db
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_users_and_routines():
    """Get existing users and their routines"""
    logger.info("📊 Fetching users and routines from database...")
    
    query = text("""
        SELECT 
            u.id as user_id,
            r.id as routine_id,
            r."estimatedDuration",
            r.name as routine_name
        FROM users u
        JOIN routines r ON r."userId" = u.id
        ORDER BY u.id, r.id
    """)
    
    with get_db() as db:
        result = db.execute(query)
        rows = result.fetchall()
        
        if not rows:
            logger.warning("⚠️  No users or routines found!")
            return []
        
        logger.info(f"✅ Found {len(rows)} user-routine combinations")
        return rows


def generate_workout_scenarios(user_id: str, routine_id: str, estimated_duration: int):
    """
    Generate realistic workout scenarios
    
    Returns list of workout data with:
    - Liked scenarios: completed, good performance, multiple times
    - Not-liked scenarios: incomplete, poor performance, or single time
    """
    scenarios = []
    
    # Scenario 1: Liked - Completed multiple times with good performance
    # User does this routine 3-5 times, finishes faster or on time
    num_liked = random.randint(3, 5)
    for i in range(num_liked):
        date = datetime.now() - timedelta(days=random.randint(1, 90))
        # Good performance: finish 0 to 2 minutes faster
        time_delta = random.randint(-120, 0)  # Negative = faster
        final_duration = (estimated_duration * 60) + time_delta
        
        scenarios.append({
            'user_id': user_id,
            'routine_id': routine_id,
            'date': date.date(),
            'completed': True,
            'final_duration': final_duration,
            'notes': f'Good performance - finished {abs(time_delta)}s faster'
        })
    
    # Scenario 2: Not-liked - Incomplete workouts
    # User starts but doesn't complete 1-2 times
    num_incomplete = random.randint(1, 2)
    for i in range(num_incomplete):
        date = datetime.now() - timedelta(days=random.randint(1, 90))
        scenarios.append({
            'user_id': user_id,
            'routine_id': routine_id,
            'date': date.date(),
            'completed': False,
            'final_duration': None,
            'notes': 'Workout not completed'
        })
    
    # Scenario 3: Not-liked - Poor performance (takes too long)
    # User completes but takes much longer than estimated
    num_poor = random.randint(1, 2)
    for i in range(num_poor):
        date = datetime.now() - timedelta(days=random.randint(1, 90))
        # Poor performance: takes 3-10 minutes longer
        time_delta = random.randint(180, 600)  # 3-10 minutes longer
        final_duration = (estimated_duration * 60) + time_delta
        
        scenarios.append({
            'user_id': user_id,
            'routine_id': routine_id,
            'date': date.date(),
            'completed': True,
            'final_duration': final_duration,
            'notes': f'Poor performance - took {time_delta}s longer than estimated'
        })
    
    # Scenario 4: Liked - Single good performance (for variety)
    # Sometimes user does routine once and does well
    if random.random() < 0.3:  # 30% chance
        date = datetime.now() - timedelta(days=random.randint(1, 90))
        time_delta = random.randint(-60, 60)  # Close to estimated
        final_duration = (estimated_duration * 60) + time_delta
        
        scenarios.append({
            'user_id': user_id,
            'routine_id': routine_id,
            'date': date.date(),
            'completed': True,
            'final_duration': final_duration,
            'notes': 'Single good performance'
        })
    
    return scenarios


def insert_workouts(scenarios):
    """Insert workout scenarios into database"""
    logger.info(f"💾 Inserting {len(scenarios)} workout records...")
    
    inserted = 0
    skipped = 0
    
    with get_db() as db:
        for scenario in scenarios:
            try:
                # Check if workout already exists (same user, routine, date)
                check_query = text("""
                    SELECT id FROM scheduled_workouts
                    WHERE "userId" = :user_id
                    AND "routineId" = :routine_id
                    AND date = :date
                """)
                
                result = db.execute(check_query, {
                    'user_id': scenario['user_id'],
                    'routine_id': scenario['routine_id'],
                    'date': scenario['date']
                })
                
                if result.fetchone():
                    skipped += 1
                    continue
                
                # Insert workout
                insert_query = text("""
                    INSERT INTO scheduled_workouts (
                        id, "userId", "routineId", date, completed, "finalDuration", notes, "createdAt", "updatedAt"
                    ) VALUES (
                        gen_random_uuid(),
                        :user_id,
                        :routine_id,
                        :date,
                        :completed,
                        :final_duration,
                        :notes,
                        NOW(),
                        NOW()
                    )
                """)
                
                db.execute(insert_query, {
                    'user_id': scenario['user_id'],
                    'routine_id': scenario['routine_id'],
                    'date': scenario['date'],
                    'completed': scenario['completed'],
                    'final_duration': scenario['final_duration'],
                    'notes': scenario['notes']
                })
                
                inserted += 1
                
            except Exception as e:
                logger.warning(f"Failed to insert workout: {e}")
                skipped += 1
        
        db.commit()
    
    logger.info(f"✅ Inserted {inserted} workouts, skipped {skipped} duplicates")
    return inserted, skipped


def main():
    """Main function to generate training data"""
    print("=" * 60)
    print("📊 Training Data Generation Script")
    print("=" * 60)
    print()
    
    # Get users and routines
    user_routines = get_users_and_routines()
    
    if not user_routines:
        print("❌ No users or routines found in database.")
        print("   Make sure you have:")
        print("   - At least one user")
        print("   - At least one routine per user")
        return
    
    print(f"📋 Found {len(user_routines)} user-routine combinations")
    print()
    
    # Ask user how many to generate
    print("How many workout records would you like to generate?")
    print("  - Recommended: 50-100 for good training data")
    print("  - More data = better model, but takes longer")
    print()
    
    try:
        num_records = input("Enter number (or press Enter for 50): ").strip()
        num_records = int(num_records) if num_records else 50
    except ValueError:
        num_records = 50
    
    print()
    print(f"🔄 Generating {num_records} workout records...")
    print("   This will create a mix of:")
    print("   ✅ Liked scenarios: Completed, good performance, multiple times")
    print("   ❌ Not-liked scenarios: Incomplete or poor performance")
    print()
    
    # Generate scenarios
    all_scenarios = []
    
    # Distribute across user-routine combinations
    records_per_combination = max(1, num_records // len(user_routines))
    
    for user_routine in user_routines:
        user_id = str(user_routine[0])
        routine_id = str(user_routine[1])
        estimated_duration = user_routine[2] or 30  # Default to 30 minutes if null
        
        # Generate scenarios for this user-routine pair
        scenarios = generate_workout_scenarios(
            user_id, routine_id, estimated_duration
        )
        
        # Limit to requested number
        if len(all_scenarios) + len(scenarios) > num_records:
            remaining = num_records - len(all_scenarios)
            scenarios = scenarios[:remaining]
        
        all_scenarios.extend(scenarios)
        
        if len(all_scenarios) >= num_records:
            break
    
    # Trim to exact number
    all_scenarios = all_scenarios[:num_records]
    
    print(f"📝 Generated {len(all_scenarios)} workout scenarios")
    print()
    
    # Count liked vs not-liked (approximate)
    completed_good = sum(1 for s in all_scenarios if s['completed'] and s['final_duration'])
    completed_poor = sum(1 for s in all_scenarios if s['completed'] and s['final_duration'] and 
                         s.get('notes', '').startswith('Poor performance'))
    incomplete = sum(1 for s in all_scenarios if not s['completed'])
    
    liked = completed_good - completed_poor  # Approximate
    not_liked = completed_poor + incomplete
    
    print(f"   ✅ Liked scenarios: ~{liked}")
    print(f"   ❌ Not-liked scenarios: ~{not_liked}")
    print()
    
    # Confirm before inserting
    confirm = input("Insert these workouts into database? (y/n): ").strip().lower()
    
    if confirm != 'y':
        print("❌ Cancelled. No data inserted.")
        return
    
    print()
    
    # Insert into database
    inserted, skipped = insert_workouts(all_scenarios)
    
    print()
    print("=" * 60)
    print("✅ Training Data Generation Complete!")
    print("=" * 60)
    print(f"Inserted: {inserted} workouts")
    print(f"Skipped: {skipped} duplicates")
    print()
    print("Next steps:")
    print("1. Train the model: python scripts/train_model.py")
    print("2. Restart the service to use the trained model")
    print()


if __name__ == "__main__":
    main()

