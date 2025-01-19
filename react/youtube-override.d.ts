declare namespace YT {
  interface Player {
      /**
       * Sets an option for a specific module.
       * @param module - The module to set the option for (e.g., 'captions').
       * @param option - The option name (e.g., 'track').
       * @param value - The value for the option.
       */
      setOption(module: 'captions', option: 'track', value: { languageCode: string }): void;

      /**
       * Gets an option for a specific module.
       * @param module - The module to get the option for (e.g., 'captions').
       * @param option - The option name (e.g., 'track').
       * @returns The value of the option.
       */
      getOption(module: 'captions', option: 'track'): { languageCode: string };
  }
}
