declare module 'express' {
  export interface Request {
    headers: any;
    body: any;
    params: any;
  }
  
  export interface Response {
    status(code: number): Response;
    json(data: any): Response;
  }
  
  export type NextFunction = (err?: any) => void;
  
  export interface Router {
    get(path: string, ...handlers: any[]): Router;
    post(path: string, ...handlers: any[]): Router;
    patch(path: string, ...handlers: any[]): Router;
    delete(path: string, ...handlers: any[]): Router;
  }
  
  export function Router(): Router;
} 