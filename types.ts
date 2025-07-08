
export interface GrammarIssue {
  original: string;
  issue: string;
  suggestion: string;
  tip: string;
}

export interface Sentiment {
  label: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
  explanation: string;
}

export interface AnalysisResult {
  transcript: string;
  summary: string;
  grammarAnalysis: GrammarIssue[];
  sentiment: Sentiment;
}

export enum AppState {
    IDLE,
    ANALYZING,
    SUCCESS,
    ERROR
}

export enum AnalysisTab {
    TRANSCRIPT = 'Transcript',
    SUMMARY = 'Summary',
    GRAMMAR = 'Grammar Coach',
    SENTIMENT = 'Sentiment'
}
