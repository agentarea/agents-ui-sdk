export interface CompressionResult {
  compressed: string | Uint8Array;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: CompressionAlgorithm;
  metadata?: Record<string, unknown>;
}

export interface CompressionOptions {
  algorithm: CompressionAlgorithm;
  level?: number; // 1-9 for most algorithms
  threshold?: number; // minimum size to compress
  chunkSize?: number; // for streaming compression
}

export type CompressionAlgorithm = 'gzip' | 'deflate' | 'lz4' | 'brotli' | 'none';

export interface CompressionMetrics {
  totalCompressions: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  averageCompressionRatio: number;
  averageCompressionTime: number;
  algorithmUsage: Record<CompressionAlgorithm, number>;
}

export class CompressionUtils {
  private static instance: CompressionUtils;
  private metrics: CompressionMetrics = {
    totalCompressions: 0,
    totalOriginalBytes: 0,
    totalCompressedBytes: 0,
    averageCompressionRatio: 1,
    averageCompressionTime: 0,
    algorithmUsage: {
      gzip: 0,
      deflate: 0,
      lz4: 0,
      brotli: 0,
      none: 0
    }
  };
  
  private constructor() {}
  
  static getInstance(): CompressionUtils {
    if (!CompressionUtils.instance) {
      CompressionUtils.instance = new CompressionUtils();
    }
    return CompressionUtils.instance;
  }
  
  // Main compression method
  async compress(data: string | object, options: CompressionOptions): Promise<CompressionResult> {
    const startTime = performance.now();
    
    // Convert data to string if needed
    const inputString = typeof data === 'string' ? data : JSON.stringify(data);
    const originalSize = new TextEncoder().encode(inputString).length;
    
    // Check threshold
    if (options.threshold && originalSize < options.threshold) {
      return this.createNoCompressionResult(inputString, originalSize);
    }
    
    let result: CompressionResult;
    
    try {
      switch (options.algorithm) {
        case 'gzip':
          result = await this.compressGzip(inputString, options);
          break;
        case 'deflate':
          result = await this.compressDeflate(inputString, options);
          break;
        case 'lz4':
          result = await this.compressLZ4(inputString, options);
          break;
        case 'brotli':
          result = await this.compressBrotli(inputString, options);
          break;
        case 'none':
        default:
          result = this.createNoCompressionResult(inputString, originalSize);
          break;
      }
      
      // Update metrics
      const compressionTime = performance.now() - startTime;
      this.updateMetrics(result, compressionTime);
      
      return result;
    } catch (error) {
      console.warn(`Compression failed with ${options.algorithm}, falling back to no compression:`, error);
      return this.createNoCompressionResult(inputString, originalSize);
    }
  }
  
  // Decompress data
  async decompress(compressedData: string | Uint8Array, algorithm: CompressionAlgorithm): Promise<string> {
    try {
      switch (algorithm) {
        case 'gzip':
          return await this.decompressGzip(compressedData);
        case 'deflate':
          return await this.decompressDeflate(compressedData);
        case 'lz4':
          return await this.decompressLZ4(compressedData);
        case 'brotli':
          return await this.decompressBrotli(compressedData);
        case 'none':
        default:
          return typeof compressedData === 'string' ? compressedData : new TextDecoder().decode(compressedData);
      }
    } catch (error) {
      console.error(`Decompression failed with ${algorithm}:`, error);
      throw new Error(`Failed to decompress data using ${algorithm}`);
    }
  }
  
  // GZIP compression (browser-compatible)
  private async compressGzip(data: string, options: CompressionOptions): Promise<CompressionResult> {
    if (typeof CompressionStream !== 'undefined') {
      // Use native CompressionStream API (modern browsers)
      return this.compressWithStream(data, 'gzip', options);
    } else {
      // Fallback for environments without CompressionStream
      return this.compressWithFallback(data, 'gzip', options);
    }
  }
  
  // Deflate compression
  private async compressDeflate(data: string, options: CompressionOptions): Promise<CompressionResult> {
    if (typeof CompressionStream !== 'undefined') {
      return this.compressWithStream(data, 'deflate', options);
    } else {
      return this.compressWithFallback(data, 'deflate', options);
    }
  }
  
  // LZ4 compression (simplified implementation)
  private async compressLZ4(data: string, options: CompressionOptions): Promise<CompressionResult> {
    // Simplified LZ4-like compression
    const compressed = this.simpleLZ4Compress(data);
    const originalSize = new TextEncoder().encode(data).length;
    const compressedSize = new TextEncoder().encode(compressed).length;
    
    return {
      compressed,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      algorithm: 'lz4',
      metadata: { level: options.level || 1 }
    };
  }
  
  // Brotli compression
  private async compressBrotli(data: string, options: CompressionOptions): Promise<CompressionResult> {
    if (typeof CompressionStream !== 'undefined') {
      return this.compressWithStream(data, 'br', options);
    } else {
      return this.compressWithFallback(data, 'brotli', options);
    }
  }
  
  // Use native CompressionStream API
  private async compressWithStream(data: string, format: string, options: CompressionOptions): Promise<CompressionResult> {
    const stream = new CompressionStream(format as any);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    // Write data
    const encoder = new TextEncoder();
    const inputBytes = encoder.encode(data);
    await writer.write(inputBytes);
    await writer.close();
    
    // Read compressed data
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalSize += value.length;
    }
    
    // Combine chunks
    const compressed = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      compressed.set(chunk, offset);
      offset += chunk.length;
    }
    
    return {
      compressed,
      originalSize: inputBytes.length,
      compressedSize: compressed.length,
      compressionRatio: inputBytes.length / compressed.length,
      algorithm: format === 'br' ? 'brotli' : format as CompressionAlgorithm,
      metadata: { level: options.level }
    };
  }
  
  // Fallback compression for environments without native support
  private async compressWithFallback(data: string, algorithm: CompressionAlgorithm, options: CompressionOptions): Promise<CompressionResult> {
    // Simple text-based compression fallback
    let compressed: string;
    
    switch (algorithm) {
      case 'gzip':
      case 'deflate':
        compressed = this.simpleDeflateCompress(data);
        break;
      case 'brotli':
        compressed = this.simpleBrotliCompress(data);
        break;
      default:
        compressed = data;
    }
    
    const originalSize = new TextEncoder().encode(data).length;
    const compressedSize = new TextEncoder().encode(compressed).length;
    
    return {
      compressed,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      algorithm,
      metadata: { fallback: true, level: options.level }
    };
  }
  
  // Simple deflate-like compression
  private simpleDeflateCompress(data: string): string {
    // Dictionary-based compression
    const dictionary = new Map<string, string>();
    let dictIndex = 0;
    let compressed = data;
    
    // Find repeated patterns
    const patterns = this.findRepeatedPatterns(data, 3, 10);
    
    // Replace patterns with shorter codes
    for (const pattern of patterns) {
      if (pattern.length > 3 && pattern.count > 1) {
        const code = `\x00${dictIndex.toString(36)}`;
        dictionary.set(code, pattern.text);
        compressed = compressed.split(pattern.text).join(code);
        dictIndex++;
      }
    }
    
    // Prepend dictionary
    const dictStr = JSON.stringify(Object.fromEntries(dictionary));
    return `${dictStr.length.toString(36)}:${dictStr}${compressed}`;
  }
  
  // Simple Brotli-like compression
  private simpleBrotliCompress(data: string): string {
    // Use a combination of dictionary and run-length encoding
    let compressed = this.runLengthEncode(data);
    compressed = this.simpleDeflateCompress(compressed);
    return compressed;
  }
  
  // Simple LZ4-like compression
  private simpleLZ4Compress(data: string): string {
    const result: string[] = [];
    let i = 0;
    
    while (i < data.length) {
      // Look for matches in previous data
      const match = this.findLongestMatch(data, i, Math.max(0, i - 65536));
      
      if (match && match.length >= 4) {
        // Encode match as offset:length
        result.push(`\x01${(i - match.offset).toString(36)}:${match.length.toString(36)}`);
        i += match.length;
      } else {
        // Literal character
        result.push(data[i]);
        i++;
      }
    }
    
    return result.join('');
  }
  
  // Run-length encoding
  private runLengthEncode(data: string): string {
    const result: string[] = [];
    let i = 0;
    
    while (i < data.length) {
      const char = data[i];
      let count = 1;
      
      // Count consecutive characters
      while (i + count < data.length && data[i + count] === char && count < 255) {
        count++;
      }
      
      if (count > 3) {
        result.push(`\x02${count.toString(36)}${char}`);
      } else {
        result.push(char.repeat(count));
      }
      
      i += count;
    }
    
    return result.join('');
  }
  
  // Find repeated patterns in text
  private findRepeatedPatterns(text: string, minLength: number, maxLength: number): Array<{ text: string; count: number; length: number }> {
    const patterns = new Map<string, number>();
    
    for (let len = minLength; len <= maxLength; len++) {
      for (let i = 0; i <= text.length - len; i++) {
        const pattern = text.substr(i, len);
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    }
    
    return Array.from(patterns.entries())
      .filter(([, count]) => count > 1)
      .map(([text, count]) => ({ text, count, length: text.length }))
      .sort((a, b) => (b.count * b.length) - (a.count * a.length));
  }
  
  // Find longest match for LZ compression
  private findLongestMatch(data: string, pos: number, searchStart: number): { offset: number; length: number } | null {
    let bestMatch: { offset: number; length: number } | null = null;
    
    for (let i = searchStart; i < pos; i++) {
      let matchLength = 0;
      
      while (
        pos + matchLength < data.length &&
        i + matchLength < pos &&
        data[pos + matchLength] === data[i + matchLength] &&
        matchLength < 255
      ) {
        matchLength++;
      }
      
      if (matchLength > 0 && (!bestMatch || matchLength > bestMatch.length)) {
        bestMatch = { offset: i, length: matchLength };
      }
    }
    
    return bestMatch;
  }
  
  // Decompression methods
  private async decompressGzip(data: string | Uint8Array): Promise<string> {
    if (typeof DecompressionStream !== 'undefined') {
      return this.decompressWithStream(data, 'gzip');
    } else {
      return this.decompressWithFallback(data, 'gzip');
    }
  }
  
  private async decompressDeflate(data: string | Uint8Array): Promise<string> {
    if (typeof DecompressionStream !== 'undefined') {
      return this.decompressWithStream(data, 'deflate');
    } else {
      return this.decompressWithFallback(data, 'deflate');
    }
  }
  
  private async decompressLZ4(data: string | Uint8Array): Promise<string> {
    const dataStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
    return this.simpleLZ4Decompress(dataStr);
  }
  
  private async decompressBrotli(data: string | Uint8Array): Promise<string> {
    if (typeof DecompressionStream !== 'undefined') {
      return this.decompressWithStream(data, 'br');
    } else {
      return this.decompressWithFallback(data, 'brotli');
    }
  }
  
  // Use native DecompressionStream API
  private async decompressWithStream(data: string | Uint8Array, format: string): Promise<string> {
    const stream = new DecompressionStream(format as any);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    // Write compressed data
    const inputBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    await writer.write(inputBytes);
    await writer.close();
    
    // Read decompressed data
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalSize += value.length;
    }
    
    // Combine chunks and decode
    const decompressed = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }
    
    return new TextDecoder().decode(decompressed);
  }
  
  // Fallback decompression
  private async decompressWithFallback(data: string | Uint8Array, algorithm: CompressionAlgorithm): Promise<string> {
    const dataStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
    
    switch (algorithm) {
      case 'gzip':
      case 'deflate':
        return this.simpleDeflateDecompress(dataStr);
      case 'brotli':
        return this.simpleBrotliDecompress(dataStr);
      default:
        return dataStr;
    }
  }
  
  // Simple deflate decompression
  private simpleDeflateDecompress(data: string): string {
    // Extract dictionary
    const colonIndex = data.indexOf(':');
    if (colonIndex === -1) return data;
    
    const dictLength = parseInt(data.substring(0, colonIndex), 36);
    const dictStr = data.substring(colonIndex + 1, colonIndex + 1 + dictLength);
    const compressed = data.substring(colonIndex + 1 + dictLength);
    
    try {
      const dictionary = JSON.parse(dictStr);
      let decompressed = compressed;
      
      // Replace codes with original patterns
      for (const [code, pattern] of Object.entries(dictionary)) {
        decompressed = decompressed.split(code).join(pattern as string);
      }
      
      return decompressed;
    } catch {
      return data; // Return original if decompression fails
    }
  }
  
  // Simple Brotli decompression
  private simpleBrotliDecompress(data: string): string {
    let decompressed = this.simpleDeflateDecompress(data);
    decompressed = this.runLengthDecode(decompressed);
    return decompressed;
  }
  
  // Simple LZ4 decompression
  private simpleLZ4Decompress(data: string): string {
    const result: string[] = [];
    let i = 0;
    
    while (i < data.length) {
      if (data[i] === '\x01') {
        // Match reference
        i++;
        const colonIndex = data.indexOf(':', i);
        const offset = parseInt(data.substring(i, colonIndex), 36);
        const lengthEnd = data.indexOf('\x01', colonIndex + 1);
        const endIndex = lengthEnd === -1 ? data.length : lengthEnd;
        const length = parseInt(data.substring(colonIndex + 1, endIndex), 36);
        
        // Copy from previous data
        const startPos = result.length - offset;
        for (let j = 0; j < length; j++) {
          result.push(result[startPos + j] || '');
        }
        
        i = endIndex;
      } else {
        // Literal character
        result.push(data[i]);
        i++;
      }
    }
    
    return result.join('');
  }
  
  // Run-length decoding
  private runLengthDecode(data: string): string {
    const result: string[] = [];
    let i = 0;
    
    while (i < data.length) {
      if (data[i] === '\x02') {
        // Run-length encoded sequence
        i++;
        let countEnd = i;
        while (countEnd < data.length && data[countEnd] !== '\x02' && /[0-9a-z]/.test(data[countEnd])) {
          countEnd++;
        }
        
        const count = parseInt(data.substring(i, countEnd), 36);
        const char = data[countEnd];
        
        result.push(char.repeat(count));
        i = countEnd + 1;
      } else {
        result.push(data[i]);
        i++;
      }
    }
    
    return result.join('');
  }
  
  // Create no-compression result
  private createNoCompressionResult(data: string, originalSize: number): CompressionResult {
    return {
      compressed: data,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      algorithm: 'none'
    };
  }
  
  // Update compression metrics
  private updateMetrics(result: CompressionResult, compressionTime: number): void {
    this.metrics.totalCompressions++;
    this.metrics.totalOriginalBytes += result.originalSize;
    this.metrics.totalCompressedBytes += result.compressedSize;
    this.metrics.algorithmUsage[result.algorithm]++;
    
    // Update average compression ratio
    this.metrics.averageCompressionRatio = this.metrics.totalOriginalBytes / this.metrics.totalCompressedBytes;
    
    // Update average compression time
    const totalTime = this.metrics.averageCompressionTime * (this.metrics.totalCompressions - 1) + compressionTime;
    this.metrics.averageCompressionTime = totalTime / this.metrics.totalCompressions;
  }
  
  // Public API methods
  
  // Get compression metrics
  getMetrics(): CompressionMetrics {
    return { ...this.metrics };
  }
  
  // Get optimal algorithm for data
  getOptimalAlgorithm(data: string | object, options?: { prioritizeSpeed?: boolean; prioritizeRatio?: boolean }): CompressionAlgorithm {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const size = new TextEncoder().encode(dataStr).length;
    
    // Small data - no compression
    if (size < 1024) {
      return 'none';
    }
    
    // Medium data - fast compression
    if (size < 10240) {
      return options?.prioritizeSpeed ? 'lz4' : 'deflate';
    }
    
    // Large data - best compression
    if (options?.prioritizeRatio) {
      return 'brotli';
    } else if (options?.prioritizeSpeed) {
      return 'lz4';
    } else {
      return 'gzip'; // Good balance
    }
  }
  
  // Benchmark compression algorithms
  async benchmarkAlgorithms(testData: string): Promise<Record<CompressionAlgorithm, { ratio: number; time: number }>> {
    const algorithms: CompressionAlgorithm[] = ['none', 'lz4', 'deflate', 'gzip', 'brotli'];
    const results: Record<string, { ratio: number; time: number }> = {};
    
    for (const algorithm of algorithms) {
      const startTime = performance.now();
      
      try {
        const result = await this.compress(testData, { algorithm });
        const endTime = performance.now();
        
        results[algorithm] = {
          ratio: result.compressionRatio,
          time: endTime - startTime
        };
      } catch (error) {
        results[algorithm] = {
          ratio: 1,
          time: 0
        };
      }
    }
    
    return results as Record<CompressionAlgorithm, { ratio: number; time: number }>;
  }
}

// Export singleton instance getter
export const getCompressionUtils = () => CompressionUtils.getInstance();