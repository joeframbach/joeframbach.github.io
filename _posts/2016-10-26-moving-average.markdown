---
layout: post
title: Moving Average
date: 2016-10-26
category: 'blog'
---
Here is a common interview question regarding
[Moving Averages](https://en.wikipedia.org/wiki/Moving_average).

The problem statement:
An analytics library receives lots of numbers, and can
be queried to return the average of the latest N numbers.
Implement a Stream function or class which is given a
window size, and exposes methods to add a new number
and query the moving average.

Example usage:

``` javascript
var stream = new Stream(3)
// Window size = 3

stream.add(51) // [51]
stream.add(69) // [51, 69]
stream.add(36) // [51, 69, 36]
stream.add(12) // [51, 69, 36, 12]

stream.getAverage() // (69+36+12)/3 = 39

stream.add(60) // [51, 69, 36, 12, 60]
stream.add(9)  // [51, 69, 36, 12, 60, 9]

stream.getAverage() // (12+60+9)/3 = 27
```

### The easy solution

When interviewing, I like to quickly scribble a strawman solution, an answer that
has a lot of room for improvement and buys some time to think about the next
iteration of solutions. It usually does not make use of clever data structures
and may fail some edge cases, but at least you can tell the interviewer that
you're aware of the pitfalls. This is an important part of our work: to be able
to identify gaps in code.

``` javascript
class Stream {
  constructor (size) {
    this.size = size
    this.array = []
  }
  add (n) {
    this.array.push(n)
  }
  getAverage () {
    return this.array
      .slice(-this.size)
      .reduce((s, n) => s + n, 0) / this.size
  }
}
```

Pitfalls:

- It is slow. Slice is a bottleneck. If `getAverage` is executed several times, lots of rework.
- It uses unbounded memory. The array keeps growing and growing.
- It doesn't show the interviewer that you know data structures aside from plain arrays.

(To avoid memory running away from us, we could trim the array like this)

``` javascript
  add (n) {
    this.array.push(n)
    if (this.array.length > 100) {
      this.array.splice(0, this.array.length - this.size)
    }
  }
```

(To avoid rework, we could cache the result and invalidate the cache like this)

``` javascript
class Stream {
  constructor (size) {
    this.size = size
    this.array = []
    this.average = null
  }
  add (n) {
    this.array.push(n)
    this.average = null
  }
  getAverage () {
    if (this.average === null) {
      this.average = this.array
        .slice(-this.size)
        .reduce((s, n) => s + n, 0) / this.size
    }
    return this.average
  }
}
```

### The usual solution

Here's the "usual" solution which shows that you know what a queue is.
If you encounter this question in an interview,
here is usually the answer that is wanted.
Its theoretical memory is `O(window size)`, but not in practice,
since constant allocation and deallocation uses a lot more memory
than you would expect.

``` javascript
class Stream {
  constructor (size) {
    this.size = size
    this.array = Array(size).fill(0)
    this.movingSum = 0
  }
  add (n) {
    this.movingSum += n - this.array.shift()
    this.array.push(n)
  }
  getAverage () {
    return this.movingSum / this.size
  }
}
```

This is the state of the art in most languages which have a decently managed Queue in its standard library.
But remember we are working with Javascript. Javascript has an Array which changes behavior when it grows.

### Let's build a benchmark

These numbers are obtained with [benchmark.js](https://benchmarkjs.com/) with
[microtime](https://github.com/wadey/node-microtime).
The setup code is separated from the code we are measuring.

``` javascript
Benchmark({
  setup: function () {
    class Stream { ... }
    var stream = new Stream(process.env.WINDOWSIZE)
    var inputs = Array.apply(null, Array(1000))
      .map(_ => Math.floor(Math.random() * 1000))
  },
  fn: function () {
    inputs.forEach(n => {
      stream.add(n)
      stream.getAverage()
    })
  },
  onComplete: function () {
    console.log(this.stats)
  }
})
```

The results show that once the window size grows past 16 or so, the performance drops substantially:

``` plain
Window size  Mean time
         12   704 μs
         13   676 μs
         14   800 μs
         15   769 μs
         16  2515 μs
         17  2595 μs
         18  2598 μs
         19  2544 μs
         20  2735 μs
```

The v8 engine performs optimizations for small arrays, and arrays which contain only integers.
In some javascript implementations, there are huge performance penalties for pushing and shifting
large arrays. The definition of "large" is implementation-specific. In node v7.0.0 which uses
V8 v5.4, the benchmarks seem to indicate that performance degrades with arrays greater than length of 16.

### There's a better way to solve this problem

What if we didn't have to constantly enqueue and dequeue? These are the operations
that take so much cpu time, and cause the array to be reallocated in memory, and keeps the
garbage collector busy.

The solution here uses an array as before, but rather than enqueueing and dequeueing,
it cycles through the elements in a round-robin fashion.

``` javascript
class Stream {
  constructor (size) {
    this.size = size
    this.array = Array(size).fill(0)
    this.index = 0
    this.movingSum = 0
  }
  add (n) {
    this.movingSum += n - this.array[this.index]
    this.array[this.index] = n
    this.index = (this.index + 1) % this.size
  }
  getAverage () {
    return this.movingSum / this.size
  }
}
```

The benchmark results are now consistent. There is no memory reallocation happening, and the garbage
collector has chilled out:

``` plain
Window size  Mean time
         12   603 μs
         13   592 μs
         14   597 μs
         15   620 μs
         16   636 μs
         17   576 μs
         18   645 μs
         19   614 μs
         20   583 μs
```

### The Bieber Problem

There's another important aspect to consider.
Will this moving-average service be read-heavy or write-heavy?
"The Bieber Problem", named after pop star Justin Bieber
who has nearly 90 million followers on Twitter,
is frequently presented like this:

> When the Biebs tweets, a few things happen:
>
> 1. Twitter informs 90 million people about a new tour.
> 2. 90 million ~~people~~ bots respond to this development (nobody reads those responses).
> 
> Describe the difficulties in handling this phenomenon,
> and describe how you would architect a system that
> is capable of handling it.

Let's run some numbers for our two implementations with
two usage profiles:

- "Write-heavy" is a benchmark that writes 1000 numbers then does one read.  
- "Read-heavy is a benchmark that writes one number then does 1000 reads.

``` plain
Window size    Write-heavy     Read-heavy
             R-Robin  Easy  R-Robin  Easy
         12      451   441      188  5548
         13      471   418      189  5573
         14      461   413      194  5571
         15      467   416      187  5696
         16      454   439      204  6207
         17      459   414      191  7114
         18      471   424      190  6420
         19      453   417      198  6546
         20      460   491      211  6741
```

In the write-heavy profile, where a firehose of numbers is attached to
our moving-average service, but the output is infrequently queried,
then we don't want to do so much upfront work. The "easy" solution
actually does quite well! 

In the read-heavy profile, where numbers come in slowly but a neurotic PM
has a close eye on metrics so they can pull the A/B test after a few hours,
then our round-robin array solution is best.

Back to "The Bieber Problem", how do we decide on an implementation that is
best for both write-heavy *and* read-heavy scenarios? This contrived
moving-average service is lucky that it doesn't really do much. Think about
Twitter's scale problems for a few minutes.

### Exercises for the reader

- Write a `getMaximum` method, which returns the largest number from the window.
For example, with a window size of `5` and inputs `[4, 5, 8, 2, 3, 5, 7, 1]`,
the latest window is `[2, 3, 5, 7, 1]` and the maximum there is `7`.
Think about performance in both the write-heavy and read-heavy profiles.
([Hint](http://eloquentjavascript.net/1st_edition/appendix2.html))

- Write a `getWeightedAverage` method. This is commonly used
in stock markets, where today's values are very important,
yesterday's values are somewhat important, and last week's
values are of little importance. Example calculation: Given the
most recent values of `[12, 16, 14, 17, 9]`, the weighted average
could be `(1*12 + 2*16 + 3*14 + 4*17 + 5*9) / (1 + 2 + 3 + 4 + 5)`.

- Explore [Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays).
By hinting the engine that your array is a fixed size and will only
contain integers, the engine can perform some very beneficial optimizations.
`DataView`s can be used to quickly select a subset of your array.

- Use [RxJS](https://github.com/Reactive-Extensions/RxJS) so that the
Stream exposes a `push` method rather than `add`, and other listeners
can subscribe to updates.

- Use [ReadableStream](https://jakearchibald.com/2016/streams-ftw/)s.
`ReadableStream` is in early draft but has a reference implementation
that can be used as a polyfill. I haven't ventured into this
territory yet, but it sounds promising.

Good luck!
