const STATE = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class CustomPromise {
  constructor(executor) {
    this.state = STATE.PENDING;
    this.value = undefined;
    this.thenHandlers = [];
    this.catchHandlers = [];

    // Ensure the context is bound correctly
    this.internalResolve = this.internalResolve.bind(this);
    this.internalReject = this.internalReject.bind(this);

    try {
      executor(this.internalResolve, this.internalReject);
    } catch (error) {
      this.internalReject(error);
    }
  }

  internalResolve(value) {
    // Ensure the code runs asynchronously in the microtask queue
    queueMicrotask(() => {
      if (this.state !== STATE.PENDING) return;

      if (value instanceof CustomPromise) {
        value.then(this.internalResolve, this.internalReject);
        return;
      }

      this.state = STATE.FULFILLED;
      this.value = value;

      this.runHandlers();
    });
  }

  internalReject(error) {
    // Ensure the code runs asynchronously in the microtask queue
    queueMicrotask(() => {
      if (this.state !== STATE.PENDING) return;

      if (error instanceof CustomPromise) {
        error.then(this.internalResolve, this.internalReject);
        return;
      }

      this.state = STATE.REJECTED;
      this.value = error;

      this.runHandlers();
    });
  }

  runHandlers() {
    if (this.state === STATE.FULFILLED) {
      this.thenHandlers.forEach((handler) => handler(this.value));
      this.thenHandlers = [];
    }

    if (this.state === STATE.REJECTED) {
      this.catchHandlers.forEach((handler) => handler(this.value));
      this.catchHandlers = [];
    }
  }

  then(onFulfilled, onRejected) {
    return new CustomPromise((resolve, reject) => {
      this.thenHandlers.push((result) => {
        if (onFulfilled == null) {
          resolve(result);
        } else {
          try {
            resolve(onFulfilled(result));
          } catch (error) {
            reject(error);
          }
        }
      });

      this.catchHandlers.push((error) => {
        if (onRejected == null) {
          reject(error);
        } else {
          try {
            resolve(onRejected(error));
          } catch (err) {
            reject(err);
          }
        }
      });

      this.runHandlers();
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (error) => {
        onFinally?.();
        throw error;
      }
    );
  }

  // Static methods
  static resolve(value) {
    return new CustomPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    return new CustomPromise((_, reject) => reject(reason));
  }

  static all(promises) {
    return new CustomPromise((resolve, reject) => {
      let results = [];
      let completed = 0;

      promises.forEach((promise, index) => {
        CustomPromise.resolve(promise)
          .then((value) => {
            results[index] = value;
            completed += 1;
            if (completed === promises.length) {
              resolve(results);
            }
          })
          .catch(reject);
      });
    });
  }

  static allSettled(promises) {
    return new CustomPromise((resolve) => {
      let results = [];
      let completed = 0;

      promises.forEach((promise, index) => {
        CustomPromise.resolve(promise)
          .then((value) => {
            results[index] = { status: STATE.FULFILLED, value };
          })
          .catch((reason) => {
            results[index] = { status: STATE.REJECTED, reason };
          })
          .finally(() => {
            completed += 1;
            if (completed === promises.length) {
              resolve(results);
            }
          });
      });
    });
  }

  static race(promises) {
    return new CustomPromise((resolve, reject) => {
      promises.forEach((promise) => {
        CustomPromise.resolve(promise).then(resolve).catch(reject);
      });
    });
  }

  static any(promises) {
    return new CustomPromise((resolve, reject) => {
      let errors = [];
      let rejectedCount = 0;

      promises.forEach((promise, index) => {
        CustomPromise.resolve(promise)
          .then(resolve)
          .catch((error) => {
            errors[index] = error;
            rejectedCount += 1;
            if (rejectedCount === promises.length) {
              reject(new AggregateError(errors, "All promises were rejected"));
            }
          });
      });
    });
  }
}

module.exports = CustomPromise;
