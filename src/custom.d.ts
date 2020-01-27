// https://github.com/joonhocho/tsdef/blob/master/src/index.ts

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer I>
    ? Array<DeepPartial<I>>
    : DeepPartial<T[P]>
}

type Writeable<T> = { -readonly [P in keyof T]: T[P] }
