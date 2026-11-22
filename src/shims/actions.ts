// The film never saves anything: every server action is a promise that never settles.
const never = () => new Promise<never>(() => {});
export const answerGuidedQuestionAction = never;
export const finishGuidedAction = never;
export const finishGuidedResearchAction = never;
export const nextGuidedQuestionAction = never;
export const runGuidedResearchAction = never;
export const saveGuidedBasicsAction = never;
export const saveGuidedProgrammeAction = never;
export const startGuidedPlanAction = never;
export const adminLogoutAction = never;
export const switchClubAction = never;
