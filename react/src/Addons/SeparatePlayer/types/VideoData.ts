import TimestampAndLyric from "./TimestampAndLyric";

export default interface VideoData{
  videoId: string;
  title: string;
  timeStampAndLyricList: TimestampAndLyric[];
  path: string;
}