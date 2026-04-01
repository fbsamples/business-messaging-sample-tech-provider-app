// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


// ============================================================================
// ERROR FORMATTING UTILITIES
// ============================================================================
// This module provides utilities for formatting and displaying error/status data
// in a tree-like structure with arrows and indentation.

// ============================================================================
// CONSTANTS
// ============================================================================
const arrow_right = " \u{2192} ";  // Right arrow for sequential operations
const arrow_down = " \u{21B3} ";   // Down arrow for parallel operations

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================


// ============================================================================
// CORE PARSING FUNCTIONS
// ============================================================================

/**
 * Parses parallel operations (operations that happen simultaneously)
 * @param str - Accumulated string
 * @param indent - Current indentation level
 * @param parallel - Array of parallel operations
 * @returns Formatted string with parallel operations
 */
interface OperationStatus {
    fun: string;
    status: string;
    result: unknown;
    error: unknown;
}

function parseP(str: string, indent: string, parallel: (OperationStatus | OperationStatus[])[]): string {
    parallel.forEach(function (serial, i) {
        if (i === 0) {
            // First parallel operation uses right arrow
            str += arrow_right;
            str += parseS("", indent, serial);
        } else {
            // Subsequent parallel operations use down arrow
            str += indent + arrow_down;
            str += parseS("", indent, serial);
        }
    });
    return str;
}

/**
 * Parses serial operations (operations that happen in sequence)
 * @param str - Accumulated string
 * @param indent - Current indentation level
 * @param serial - Array of serial operations
 * @returns Formatted string with serial operations
 */
function parseS(str: string, indent: string, serial: (OperationStatus | OperationStatus[])[]): string {
    serial.forEach(function (serialItem, i) {
        if (Array.isArray(serialItem)) {
            // If item is an array, it contains parallel operations
            str += parseP("", indent, serialItem);
        } else {
            // If item is not an array, it's a single operation
            if (i > 0) str += arrow_right;  // Add separator between operations

            const content = `${serialItem.status} (${serialItem.fun})`;
            str += content;

            // Increase indentation for next level
            indent += ' '.repeat(content.length + 3);

            // Add newline at the end of a serial sequence
            if (i === serial.length - 1) {
                str += "\n";
            }
        }
    });
    return str;
}

// ============================================================================
// MAIN EXPORTED FUNCTIONS
// ============================================================================

/**
 * Main function to format error/status data into a readable tree structure
 * @param data - Array of operations with status and function names
 * @returns Formatted string representation
 */
function formatErrors(data: (OperationStatus | OperationStatus[])[]): string {
    return parseP("", "", data);
}

/**
 * Wraps a promise with error handling and status tracking
 * @param promise - Promise to wrap
 * @param label - Label for the operation
 * @returns Promise that resolves to status object
 */
function wrapFn(promise: Promise<unknown>, label: string): Promise<OperationStatus[]> {
    return promise
        .then(data => {
            return [{ fun: label, status: "completed", result: data, error: null }];
        })
        .catch(err => {
            console.error(err);
            return [{ fun: label, status: "failed", result: null, error: err }];
        });
}

/**
 * Creates a function that chains operations with previous results
 * @param promise - Promise function to execute
 * @param label - Label for the operation
 * @returns Function that can be chained with previous results
 */
function w(promise: (arg?: unknown) => Promise<unknown>, label: string): (prev_result?: OperationStatus[]) => Promise<OperationStatus[]> {
    return (prev_result) => {
        let arg: unknown;
        if (!prev_result) prev_result = [];

        // Extract result from previous operation if available
        if (prev_result[prev_result.length - 1]) {
            arg = prev_result[prev_result.length - 1].result;
            if (prev_result[prev_result.length - 1]) {
                prev_result = [];
            }
        }

        // Execute promise and return status object
        return promise(arg)
            .then(data => {
                return [...prev_result, { fun: label, status: "completed", result: data, error: null }];
            })
            .catch(err => {
                return [...prev_result, { fun: label, status: "failed", result: null, error: err }];
            });
    };
}

/**
 * Creates a skipped operation status (for operations that are intentionally not executed)
 * @param label - Label for the skipped operation
 * @returns Status object indicating skipped operation
 */
function skipProm(label: string): OperationStatus[] {
    return [{ fun: label, status: "skipped", result: null, error: null }];
}

// ============================================================================
// EXPORTS
// ============================================================================
export { formatErrors };
export { wrapFn };
export { skipProm };
