```
## AQUATIC BLUEPRINT REVIEWS
DefineAgent Fish
UseFeature [FeatureName]
property Costume:costumes = [ { default:['fish.png'] }]
property Movement:control = "script"
property Movement:moveDistancePerFrame = 3
property MoveRotationPerFrame = 45
property IsActive = true
property FoodLEvel:NumberRange(0,100) = 50
when
  bee touches Algae
then
  this.FoodLevel inc 1
  algae.IsActive = false
  
on 1 sec
  this.FoodLevel dec
  if (this.FoodLEvel < 1)
  then this.IsActive = false;

DefineAgent Algae
similar 

LightBeam
con

UseFeature StateMeter
	StateMeter:data = this.Hunger
```



```
DefineAgent Bee
	useFeature Movement, Costumes, Particles, Sticker
Costumes:
	costumes [ walk, fly ]
	state = walk
	fps = 4
Movement:
	control = user
Sticker:
	drop()
Particles:
	call emitDroplet()
	
```

