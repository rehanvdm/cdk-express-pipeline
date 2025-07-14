import { Operation, applyPatch } from 'fast-json-patch/commonjs/core';


export interface Patch {
  readonly op: string;
  readonly path: string;
  readonly value?: any;
  readonly from?: string;
}

/**
 * Utility for applying RFC-6902 JSON-Patch to a document.
 *
 * Use the the `JsonPatch.apply(doc, ...ops)` function to apply a set of
 * operations to a JSON document and return the result.
 *
 * Operations can be created using the factory methods `JsonPatch.add()`,
 * `JsonPatch.remove()`, etc.
 *
 * const output = JsonPatch.apply(input,
 *   JsonPatch.replace('/world/hi/there', 'goodbye'),
 *   JsonPatch.add('/world/foo/', 'boom'),
 *   JsonPatch.remove('/hello'),
 * );
 *
 */
export class JsonPatch {
  /**
   * Adds a value to an object or inserts it into an array. In the case of an
   * array, the value is inserted before the given index. The - character can be
   * used instead of an index to insert at the end of an array.
   *
   * @example JsonPatch.add('/milk', true)
   * @example JsonPatch.add('/biscuits/1', { "name": "Ginger Nut" })
   */
  public static add(path: string, value: any): Patch {
    return { op: 'add', path, value };
  }

  /**
   * Removes a value from an object or array.
   *
   * @example JsonPatch.remove('/biscuits')
   * @example JsonPatch.remove('/biscuits/0')
   */
  public static remove(path: string): Patch {
    return { op: 'remove', path };
  }

  /**
   * Replaces a value. Equivalent to a “remove” followed by an “add”.
   *
   * @example JsonPatch.replace('/biscuits/0/name', 'Chocolate Digestive')
   */
  public static replace(path: string, value: any): Patch {
    return { op: 'replace', path, value };
  }

  /**
   * Copies a value from one location to another within the JSON document. Both
   * from and path are JSON Pointers.
   *
   * @example JsonPatch.copy('/biscuits/0', '/best_biscuit')
   */
  public static copy(from: string, path: string): Patch {
    return { op: 'copy', from, path };
  }

  /**
   * Moves a value from one location to the other. Both from and path are JSON Pointers.
   *
   * @example JsonPatch.move('/biscuits', '/cookies')
   */
  public static move(from: string, path: string): Patch {
    return { op: 'move', from, path };
  }

  /**
   * Tests that the specified value is set in the document. If the test fails,
   * then the patch as a whole should not apply.
   *
   * @example JsonPatch.test('/best_biscuit/name', 'Choco Leibniz')
   */
  public static test(path: string, value: any): Patch {
    return { op: 'test', path, value };
  }

  /**
   * Applies a set of JSON-Patch (RFC-6902) operations to `document` and returns the result.
   * @param document The document to patch
   * @param ops The operations to apply
   * @returns The result document
   */
  public patch(document: any, ...ops: Patch[]): any {
    const result = applyPatch(
      document,
      ops as Operation[],
    );
    return result.newDocument;
  }
}