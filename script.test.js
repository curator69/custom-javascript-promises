const CustomPromise = require("./index");

describe("CustomPromise", () => {
  test("resolves with a value", () => {
    return new CustomPromise((resolve) => {
      setTimeout(() => resolve("Success"), 100);
    }).then((value) => {
      expect(value).toBe("Success");
    });
  });

  test("rejects with an error", () => {
    return new CustomPromise((_, reject) => {
      setTimeout(() => reject("Error"), 100);
    }).catch((error) => {
      expect(error).toBe("Error");
    });
  });

  test("chains multiple thens", () => {
    return new CustomPromise((resolve) => resolve(1))
      .then((value) => value + 1)
      .then((value) => value + 1)
      .then((value) => {
        expect(value).toBe(3);
      });
  });

  test("catches errors in a chain", () => {
    return new CustomPromise((_, reject) => reject("Fail"))
      .then(() => "This will not run")
      .catch((error) => {
        expect(error).toBe("Fail");
      });
  });

  test("finally is called after resolve", () => {
    const finallyMock = jest.fn();
    return new CustomPromise((resolve) => resolve("Resolved"))
      .finally(finallyMock)
      .then((value) => {
        expect(finallyMock).toHaveBeenCalled();
        expect(value).toBe("Resolved");
      });
  });

  test("finally is called after reject", () => {
    const finallyMock = jest.fn();
    return new CustomPromise((_, reject) => reject("Rejected"))
      .finally(finallyMock)
      .catch((error) => {
        expect(finallyMock).toHaveBeenCalled();
        expect(error).toBe("Rejected");
      });
  });

  test("CustomPromise.resolve creates a resolved promise", () => {
    return CustomPromise.resolve("Resolved Value").then((value) => {
      expect(value).toBe("Resolved Value");
    });
  });

  test("CustomPromise.reject creates a rejected promise", () => {
    return CustomPromise.reject("Rejected Value").catch((error) => {
      expect(error).toBe("Rejected Value");
    });
  });

  test("CustomPromise.all resolves when all promises resolve", () => {
    return CustomPromise.all([
      CustomPromise.resolve(1),
      CustomPromise.resolve(2),
      CustomPromise.resolve(3),
    ]).then((values) => {
      expect(values).toEqual([1, 2, 3]);
    });
  });

  test("CustomPromise.all rejects if one promise rejects", () => {
    return CustomPromise.all([
      CustomPromise.resolve(1),
      CustomPromise.reject("Error"),
      CustomPromise.resolve(3),
    ]).catch((error) => {
      expect(error).toBe("Error");
    });
  });

  test("CustomPromise.allSettled resolves with all results", () => {
    return CustomPromise.allSettled([
      CustomPromise.resolve(1),
      CustomPromise.reject("Error"),
      CustomPromise.resolve(3),
    ]).then((results) => {
      expect(results).toEqual([
        { status: "fulfilled", value: 1 },
        { status: "rejected", reason: "Error" },
        { status: "fulfilled", value: 3 },
      ]);
    });
  });

  test("CustomPromise.race resolves with the first resolved value", () => {
    return CustomPromise.race([
      new CustomPromise((resolve) => setTimeout(() => resolve(1), 200)),
      new CustomPromise((resolve) => setTimeout(() => resolve(2), 100)),
      new CustomPromise((resolve) => setTimeout(() => resolve(3), 300)),
    ]).then((value) => {
      expect(value).toBe(2);
    });
  });

  test("CustomPromise.race rejects with the first rejected value", () => {
    return CustomPromise.race([
      new CustomPromise((_, reject) =>
        setTimeout(() => reject("Error 1"), 200)
      ),
      new CustomPromise((_, reject) =>
        setTimeout(() => reject("Error 2"), 100)
      ),
      new CustomPromise((resolve) => setTimeout(() => resolve(3), 300)),
    ]).catch((error) => {
      expect(error).toBe("Error 2");
    });
  });

  test("CustomPromise.any resolves with the first fulfilled promise", () => {
    return CustomPromise.any([
      new CustomPromise((_, reject) =>
        setTimeout(() => reject("Error 1"), 100)
      ),
      new CustomPromise((resolve) => setTimeout(() => resolve(2), 200)),
      new CustomPromise((resolve) => setTimeout(() => resolve(3), 300)),
    ]).then((value) => {
      expect(value).toBe(2);
    });
  });

  test("CustomPromise.any rejects with AggregateError if all reject", () => {
    return CustomPromise.any([
      CustomPromise.reject("Error 1"),
      CustomPromise.reject("Error 2"),
    ]).catch((error) => {
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.errors).toEqual(["Error 1", "Error 2"]);
    });
  });

  test("handles asynchronous resolution correctly", () => {
    return new CustomPromise((resolve) =>
      setTimeout(() => resolve("Async Resolve"), 100)
    ).then((value) => {
      expect(value).toBe("Async Resolve");
    });
  });

  test("handles asynchronous rejection correctly", () => {
    return new CustomPromise((_, reject) =>
      setTimeout(() => reject("Async Reject"), 100)
    ).catch((error) => {
      expect(error).toBe("Async Reject");
    });
  });
});
