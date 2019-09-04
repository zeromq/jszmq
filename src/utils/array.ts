export function copy<T>(src:Array<T>, srcOffset:number, dest:Array<T>, destOffset:number, length:number) {
    for (let i = 0; i < length; i++)
        dest[i + destOffset] = src[i + srcOffset]
}

export function resize<T>(src:Array<T>, size:number,ended:boolean)
{
    if (size > src.length)
    {
        const dest = new Array(size).fill(null)
        if (ended)
            copy(src, 0, dest, 0, src.length);
        else
            copy(src, 0, dest, size - src.length, src.length);
        return dest
    }
    else if (size < src.length)
    {
        const dest = new Array(size).fill(null)
        if (ended)
            copy(src, 0, dest, 0, size);
        else
            copy(src, src.length - size, dest, 0, size);
        return dest
    }

    return src
}