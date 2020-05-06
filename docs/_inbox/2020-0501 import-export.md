Hey Sri and Ben,

I wanted to follow up on our discussion about the export / import in SEEDS in terms of how we might want to think about architecture for export / import in GEM-STEP and Net.Create to the extent that it is relevant (I know a lot is also quite different, but maybe it’ll help).

So far, we’ve been mostly talking about exporting / importing “the whole thing” which consists of: 1) teachers / classrooms / settings, 2) models, 3) resources with one brief reference to the idea that maybe the resources should be separate.

I think that for our current SEEDS plans, this works fine. At most, we anticipate having 2 teachers at a given location, maybe 3. So grouping it all together is fine and if anything convenient. The one case where we might ant to share a “portion” of that data cross-site is when we create a sample model to show the other location or in another classroom. For example, in IN we made an extra group for the IU researchers and updated that model whenever we demonstrated new features, sometimes adding things in-between sessions so that we could show how we handled it. For example, adding a new entity to then show how evidence might link to it. With so few classrooms, these likely diverge, and if they don’t it is easy to re-create the model by hand in the meme interface quite quickly, especially because we can print it out and copy the text if needed. In the long-term future, that might change where we’d want to be able to share a model made at IU individually with Rutgers and vice versa. So mostly I’d say wait on worrying about it, but in case it helps in thinking about architecture I figured I’d mention it.

On Net.Create, we sort-of have this option already since we can simply copy the loki and template file over to a new install. Long-term, we’ll want to be able to send a loki and template easily to a front-end user and have them import it, but it seems that is easier on the data side. The challenge there is more tied to running multiple visualizations / groups at once.

On GEM-STEP, I think we will absolutely need / want to be able to choose to either export “all the stuff” for archival purposes and initial setup, or export a single model for sharing across sites or classrooms, possibly importing it under a new name (we might, after all, have multiple copies of something called “fish model” and want to differentiate them when uploading them). Like any programming style environment, being able to share files / code seems like it likely has real value there. Of course, if push comes to shove we’d likely prioritize that below getting the scripting and other things working well, etc. But I think we’ll need it eventually.

Anyhow, I realize these are 3 different projects with 3 different architectures, but I also know you are re-using some components and hopefully we’ll continue to find funding for next-steps in each as well (waiting on a Net.Create grant now, and planning to submit a SEEDS follow-up next year), so while we wouldn’t want to assume we’ll get the funding, I know you like thinking broadly!! 

Hopefully that helps in some small way. If not, ignore it! 

Thanks,

Joshua
