declare global {  
    interface Date {
        dateFormat(format: string): string;
        addDays(n: number): Date;
      }
}

export {}; 