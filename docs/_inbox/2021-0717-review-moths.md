## MOTH

Uses Costume, Movement, Physics, Touches, Population, Vision, AgentWidgets
Props energyLevel

FEATURE SETUP
  monitor TreeTrunk, TreeFoliage
UPDATE
* every 0.25 :: energyLevel -1
  every 1.00 :: vfx

* when first touch TreeTrunk :: energyLevel +100 :: vfx
* while touching TreeTrunk
    match color :: Vision.visionable false
    isInert :: vfx
    every 1.00 while true ::
      do :: energyLevel +10
      if energyLevel > 99 and agent not inert ::
        spawnChild w/ init yellow, position offset
      do :: energyLevel -50

* when first touch TreeFoliage ::
  energyLevel +100
  if not inert :: vfx
* when (while) touching TreeFoliage ::
  match color :: Vision.visionable false
  isInert :: vfx

* if isMoving :: 
    Vision.visionable true
    vfx

* if isInert :: vfx
  
## PREDATOR
Uses Costume, Physics, Touches, Movement, Vision
FEATURE SETUP
  monitor moths
  move toward nearest moth within 4
UPDATE
  when sees Moth :: moth.vfx
  when(while) touching Moth ::
    moth.vfx
    every 2.00 while true ::
      moth.inert true
      moth.vfx
      predator.vfx

## TREETRUNK
Uses Costume, Physics
doesn't move

## TREEFOLIAGE
Uses Costume, Physics
doesn't move

