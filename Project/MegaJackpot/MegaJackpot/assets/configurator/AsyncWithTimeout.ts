export async function asyncWithTimeout<T>(task: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
        task(),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout))
    ]);
}