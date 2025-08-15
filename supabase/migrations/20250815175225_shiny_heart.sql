/*
  # Update requests table to make title and description nullable

  1. Changes
    - Make `title` column nullable (optional)
    - Make `description` column nullable (optional)
    - Keep image_url as required field validation will be handled in application logic
*/

-- Make title nullable if it's currently NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' 
    AND column_name = 'title' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE requests ALTER COLUMN title DROP NOT NULL;
  END IF;
END $$;

-- Make description nullable if it's currently NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' 
    AND column_name = 'description' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE requests ALTER COLUMN description DROP NOT NULL;
  END IF;
END $$;