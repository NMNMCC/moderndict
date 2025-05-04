export const concat = <T extends (Array<any> | undefined)[], R = Array<NonNullable<FlatArray<T[number], 1>>>>(
    ...args: T
): R => {
    return args.flat().filter((item) => item !== undefined) as R;
};
