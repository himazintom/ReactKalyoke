import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import Cookies from 'js-cookie';

interface UseAudioManagerProps {
  isPitchMode: boolean;
  handleEndedMusic: () => void;
}

export const useAudioManager = ({ isPitchMode, handleEndedMusic }: UseAudioManagerProps) => {
  const hostUrl = process.env.REACT_APP_HOST_URL;
  if (!hostUrl) {
    throw new Error("REACT_APP_HOST_URL is not defined");
  }
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const beforePathRef = useRef<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const instAudioRef = useRef<HTMLAudioElement | null>(null);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);
  const instGainNodeRef = useRef<GainNode | null>(null);
  const vocalGainNodeRef = useRef<GainNode | null>(null);
  
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const pitchInstAudioRef = useRef<Tone.Player | null>(null);
  const pitchVocalAudioRef = useRef<Tone.Player | null>(null);
  const pitchInstGainNodeRef = useRef<Tone.Gain | null>(null);
  const pitchVocalGainNodeRef = useRef<Tone.Gain | null>(null);
  const instPitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const vocalPitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const [pitchValue, setPitchValue] = useState<number>(0);

  const [instVolume, setInstVolume] = useState(100);
  const [vocalVolume, setVocalVolume] = useState(10);
  
  useEffect(() => {
    const instVol = JSON.parse(Cookies.get('instVolume') || '100');
    if (instVol !== null && instVol !== undefined) {
      setInstVolume(instVol);
    }

    const vocalVol = JSON.parse(Cookies.get('vocalVolume') || '30');
    if (vocalVol !== null && vocalVol !== undefined) {
      setVocalVolume(vocalVol);
    }
  }, []);

  const calculateVolume = (value: number) => { // value(0.~100.)
    return Math.max(0.0, Math.min(value, 100.0)) / 100.0; // (0.0~1.0)
  };

  function playAudio() {
    if (originalAudioRef.current) {
      originalAudioRef.current.play();
    }
    if (instAudioRef.current) {
      instAudioRef.current.play();
    }
    if (vocalAudioRef.current) {
      vocalAudioRef.current.play();
    }
    if (pitchInstAudioRef.current){
      const currentTime = originalAudioRef.current?.currentTime;
      if (currentTime !== undefined) {
        pitchInstAudioRef.current.start(undefined, currentTime);
      }
    }
    if (pitchVocalAudioRef.current){
      const currentTime = originalAudioRef.current?.currentTime;
      if (currentTime !== undefined) {
        pitchVocalAudioRef.current.start(undefined, currentTime);
      }
    }
    setIsPlaying(true);
  }

  function stopAudio() {
    if (originalAudioRef.current) originalAudioRef.current.pause();
    if (instAudioRef.current) instAudioRef.current.pause();
    if (vocalAudioRef.current) vocalAudioRef.current.pause();
    if (pitchInstAudioRef.current) pitchInstAudioRef.current.stop();
    if (pitchVocalAudioRef.current) pitchVocalAudioRef.current.stop();
    setIsPlaying(false);
  }

  function seekAudio(time: number) {
    if (originalAudioRef.current) originalAudioRef.current.currentTime = time;
    if (instAudioRef.current) instAudioRef.current.currentTime = time;
    if (vocalAudioRef.current) vocalAudioRef.current.currentTime = time;
    if (pitchInstAudioRef.current) pitchInstAudioRef.current.seek(time);
    if (pitchVocalAudioRef.current) pitchVocalAudioRef.current.seek(time);
    // if(isPlaying){
    //   if (originalAudioRef.current) originalAudioRef.current.play();
    //   if (instAudioRef.current) instAudioRef.current.play();
    //   if (vocalAudioRef.current) vocalAudioRef.current.play();
    //   if (pitchInstAudioRef.current) pitchInstAudioRef.current.start();
    //   if (pitchVocalAudioRef.current) pitchVocalAudioRef.current.start();
    // }
  }

  useEffect(() => {//音量が変更されて、関数が更新されてからイベントを登録しなおし
    //console.log("useEffect handleEndedMusic Changed");
    if(instAudioRef.current){
      instAudioRef.current.removeEventListener('ended', handleEndedMusic);
      instAudioRef.current.addEventListener('ended', handleEndedMusic);
    }
    if(originalAudioRef.current){
      originalAudioRef.current.removeEventListener('ended', handleEndedMusic);
      originalAudioRef.current.addEventListener('ended', handleEndedMusic);
    }
    // クリーンアップでイベントリスナーを削除
    return () => {
      if (instAudioRef.current) {
        instAudioRef.current.removeEventListener('ended', handleEndedMusic);
      }
      if (originalAudioRef.current) {
        originalAudioRef.current.removeEventListener('ended', handleEndedMusic);
      }
    };
  }, [handleEndedMusic]);


  async function createNormalModeAudios(folderPath: string) {
    try {
      // 既存の Audio オブジェクトがあればクリーンアップ
      if (instAudioRef.current) {
        instAudioRef.current.removeEventListener("ended", handleEndedMusic);
        instGainNodeRef.current?.disconnect();
      }

      const context = audioContextRef.current!;
      const instAudio = new Audio(`${folderPath}/no_vocals.mp3`);
      const vocalAudio = new Audio(`${folderPath}/vocals.mp3`);

      await Promise.all([
        new Promise<void>((resolve) =>
          instAudio.addEventListener("canplaythrough", () => resolve(), { once: true })
        ),
        new Promise<void>((resolve) =>
          vocalAudio.addEventListener("canplaythrough", () => resolve(), { once: true })
        ),
      ]);

      const instSource = context.createMediaElementSource(instAudio);
      const instGainNode = context.createGain();
      instSource.connect(instGainNode).connect(context.destination);
      instGainNode.gain.value = calculateVolume(instVolume);
      instAudio.loop = false;
      instAudio.addEventListener("ended", handleEndedMusic);

      instAudioRef.current = instAudio;
      instGainNodeRef.current = instGainNode;

      const vocalSource = context.createMediaElementSource(vocalAudio);
      const vocalGainNode = context.createGain();
      vocalSource.connect(vocalGainNode).connect(context.destination);
      vocalGainNode.gain.value = calculateVolume(vocalVolume);
      vocalAudio.loop = false;

      vocalAudioRef.current = vocalAudio;
      vocalGainNodeRef.current = vocalGainNode;
    } catch (error) {
      console.error("Error creating normal mode audios:", error);
    }
  }

  async function createPitchModeAudios(folderPath: string) {
    try {
      const context = audioContextRef.current!;
      const originalAudio = new Audio(`${folderPath}/no_vocals.mp3`);
      const originalSource = context.createMediaElementSource(originalAudio);
      const originalGainNode = context.createGain();

      originalSource.connect(originalGainNode).connect(context.destination);
      originalGainNode.gain.value = 0;
      originalAudio.loop = false;
      originalAudio.addEventListener("ended", handleEndedMusic);
      originalAudioRef.current = originalAudio;

      const instPlayer = new Tone.Player({ url: "", loop: false, autostart: false });
      const instPitchShift = new Tone.PitchShift({pitch: 0});
      const instGainNode = new Tone.Gain(calculateVolume(instVolume));
      instPlayer.connect(instPitchShift);
      instPitchShift.connect(instGainNode);
      instGainNode.toDestination();

      const vocalPlayer = new Tone.Player({ url: "", loop: false, autostart: false });
      const vocalPitchShift = new Tone.PitchShift({pitch: 0});
      const vocalGainNode = new Tone.Gain(calculateVolume(vocalVolume));
      vocalPlayer.connect(vocalPitchShift);
      vocalPitchShift.connect(vocalGainNode);
      vocalGainNode.toDestination();

      await Promise.all([
        new Promise<void>((resolve) =>
          originalAudio.addEventListener("canplaythrough", () => resolve(), { once: true })
        ),
        instPlayer.load(`${folderPath}/no_vocals.mp3`),
        vocalPlayer.load(`${folderPath}/vocals.mp3`),
      ]);

      pitchInstAudioRef.current = instPlayer;
      pitchVocalAudioRef.current = vocalPlayer;
      pitchInstGainNodeRef.current = instGainNode;
      pitchVocalGainNodeRef.current = vocalGainNode;
      instPitchShiftRef.current = instPitchShift;
      vocalPitchShiftRef.current = vocalPitchShift;
    } catch (error) {
      console.error("Error creating pitch mode audios:", error);
    }
  }

  const prepareAudio = async (path: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      if(beforePathRef.current === path){//もし、同じパスならば、何もせずそのまま返す
        return true;
      }
      beforePathRef.current = path;

      if(isPlaying) stopAudio();

      const folderPath = hostUrl + path;

      if (isPitchMode) {
        setPitchValue(0);
        if (Tone.getContext().state !== "running") {
          await Tone.start();
        }

        await createPitchModeAudios(folderPath);
      } else {
        await createNormalModeAudios(folderPath);
      }
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  };

  useEffect(() => {
    // クリーンアップ関数を追加
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      // Tone.js のオブジェクトもクリーンアップ
      pitchInstAudioRef.current?.dispose();
      pitchVocalAudioRef.current?.dispose();
      instPitchShiftRef.current?.dispose();
      vocalPitchShiftRef.current?.dispose();
      pitchInstGainNodeRef.current?.dispose();
      pitchVocalGainNodeRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    // 音量の変更を反映
    if (instGainNodeRef.current) {
      instGainNodeRef.current.gain.value = calculateVolume(instVolume);
    }
    if (vocalGainNodeRef.current) {
      vocalGainNodeRef.current.gain.value = calculateVolume(vocalVolume);
    }
    if(pitchInstGainNodeRef.current){
      pitchInstGainNodeRef.current.gain.value = calculateVolume(instVolume);
    }
    if(pitchVocalGainNodeRef.current){
      pitchVocalGainNodeRef.current.gain.value = calculateVolume(vocalVolume);
    }
  }, [instVolume, vocalVolume]);

  const handlePitchChange = (change: number) => {
    setPitchValue((prevPitch) => {
      const newPitch = prevPitch + change;
      if(instPitchShiftRef.current){
        instPitchShiftRef.current.pitch = newPitch;
      }
      if(vocalPitchShiftRef.current){
        vocalPitchShiftRef.current.pitch = newPitch;
      }
      return newPitch;
    });
  };

  return {
    AudioRef: isPitchMode ? originalAudioRef : instAudioRef,
    currentPitch: pitchValue,
    prepareAudio,
    playAudio,
    stopAudio,
    seekAudio,
    setInstVolume,
    setVocalVolume,
    handlePitchChange,
    // 他に必要なものがあれば追加
  };
};

