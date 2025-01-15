import TimestampAndLyric from "../types/TimestampAndLyric";

export const timestampExistCheck = (text: string): boolean | string[] => {
  if (!text) {
    return [];  // 文字列が空または未定義の場合、空の警告リストを返す
  }

  const lines = text.split('\n');
  const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/;
  let warnings: string[] = [];
  
  let timestampExist = lines.some(line => timestampRegex.test(line));
  if (!timestampExist) {
    return false;  // タイムスタンプが一つもない場合、警告を返す
  }

  lines.forEach((line, index) => {
    if (!timestampRegex.test(line)) {
      warnings.push(`${index + 1}行目: 「${line}」にタイムスタンプがありません`);
    }
  });

  if (warnings.length > 0) {
    return warnings;  // タイムスタンプ抜けがあった場合、警告リストを返す
  }
  
  return true;  // 問題がなければ true を返す
}

export const timestampChronologyCheck = (text: string): true | string => {
  if (text) {
    const lines = text.split('\n');
    const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/; // 1から3桁の小数点部分に対応
    let lastTimestamp = 0; // 最後に確認したタイムスタンプを初期化
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const timestampMatch = line.match(timestampRegex);
      if (timestampMatch) {
        // タイムスタンプを抽出して秒に変換
        const timeParts = timestampMatch[0].substring(1, timestampMatch[0].length - 1).split(':');
        const minutes = parseInt(timeParts[0], 10);
        const seconds = parseFloat(timeParts[1]);
        const currentTimestamp = minutes * 60 + seconds;
  
        if (currentTimestamp < lastTimestamp) {
          return `${i + 1}行目: 「${line}」が時系列に沿っていません。1行前より大きな時間を登録してください。`;
        }
        lastTimestamp = currentTimestamp; // 最後のタイムスタンプを更新
      }
    }
  }
  return true;
}

export const timestampize = (text: string) => {
  try {
    const playerLyricList = [];

    //最初の歌詞を真ん中に表示させるための空の要素2個をリストに追加
    playerLyricList.push({ timestamp: 0.0, lyric: '' });
    playerLyricList.push({ timestamp: 0.0, lyric: '' });

    if (text) {
      const lines = text.split('\n');
      const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/; // 1から3桁の小数点部分に対応

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const timestampMatch = line.match(timestampRegex);

        if (timestampMatch) {
          const timeParts = timestampMatch[0].substring(1, timestampMatch[0].length - 1).split(':');
          const minutes = parseInt(timeParts[0], 10);
          const seconds = parseFloat(timeParts[1]);
          const currentTimestamp = minutes * 60 + seconds;

          const lyric = line.replace(timestampRegex, '').trim();

          playerLyricList.push({
            timestamp: currentTimestamp,
            lyric: lyric,
          });
        }
      }
    }
    return playerLyricList; // return文を正しい位置に配置
  } catch (error) {
    console.error('Error processing text:', error);  // エラーをコンソールに表示
    return [];  // 空の配列を返すか、別の適切なエラーハンドリングを行う
  }
};

// タイムスタンプの有無確認と歌詞のリストを作成する関数
export const makeTimestampAndLyricList = (
  lyric: string,
  setUrlFormErrorMessage: ((errorMessage: string) => void) | null = null,
  setLyricFormUrlWarningMessage: ((warnings: string[]) => void) | null = null
): [TimestampAndLyric[], boolean] => {
  let isTimestamped = false;
  let timestampAndLyricList: TimestampAndLyric[] = [];
  
  const timestampCheckResult = timestampExistCheck(lyric);
  
  if (timestampCheckResult === true) {//タイムスタンプがあるかをチェック
    const timestampChronologyCheckResult = timestampChronologyCheck(lyric);
    if (timestampChronologyCheckResult === true) {
      const timestampedLyric = timestampize(lyric);
      timestampAndLyricList = timestampedLyric.map(item => ({
        timestamp: item.timestamp,
        lyric: item.lyric
      }));
      isTimestamped = true;
    } else if (setUrlFormErrorMessage) {//タイムスタンプの時系列があっていない場合
      setUrlFormErrorMessage(timestampChronologyCheckResult);
    }
  } else if (Array.isArray(timestampCheckResult)) {
    if (setLyricFormUrlWarningMessage) {
      setLyricFormUrlWarningMessage(timestampCheckResult);
    }
  } else {//タイムスタンプがない場合
    const tempLyricList: string[] = lyric.split('\n');
    timestampAndLyricList = tempLyricList.map(item => ({
      timestamp: 0,
      lyric: item
    }));
  }
  
  return [timestampAndLyricList, isTimestamped];
}

