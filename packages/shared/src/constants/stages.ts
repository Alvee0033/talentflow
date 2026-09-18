import { ApplicationStage } from '../enums/application-stage.enum';

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  [ApplicationStage.NEW]: 'New',
  [ApplicationStage.SCREENING]: 'Screening',
  [ApplicationStage.ASSESSMENT]: 'Assessment',
  [ApplicationStage.INTERVIEW]: 'Interview',
  [ApplicationStage.FEEDBACK_PENDING]: 'Feedback Pending',
  [ApplicationStage.APPROVAL]: 'Approval',
  [ApplicationStage.SELECTED]: 'Selected',
  [ApplicationStage.JOINING]: 'Joining',
  [ApplicationStage.JOINED]: 'Joined',
};

export const STAGE_ORDER: ApplicationStage[] = [
  ApplicationStage.NEW,
  ApplicationStage.SCREENING,
  ApplicationStage.ASSESSMENT,
  ApplicationStage.INTERVIEW,
  ApplicationStage.FEEDBACK_PENDING,
  ApplicationStage.APPROVAL,
  ApplicationStage.SELECTED,
  ApplicationStage.JOINING,
  ApplicationStage.JOINED,
];

export const VALID_STAGE_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  [ApplicationStage.NEW]: [ApplicationStage.SCREENING],
  [ApplicationStage.SCREENING]: [ApplicationStage.ASSESSMENT, ApplicationStage.INTERVIEW],
  [ApplicationStage.ASSESSMENT]: [ApplicationStage.INTERVIEW],
  [ApplicationStage.INTERVIEW]: [ApplicationStage.FEEDBACK_PENDING],
  [ApplicationStage.FEEDBACK_PENDING]: [ApplicationStage.APPROVAL],
  [ApplicationStage.APPROVAL]: [ApplicationStage.SELECTED],
  [ApplicationStage.SELECTED]: [ApplicationStage.JOINING],
  [ApplicationStage.JOINING]: [ApplicationStage.JOINED],
  [ApplicationStage.JOINED]: [],
};
