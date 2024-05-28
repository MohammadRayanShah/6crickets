import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CountdownTimerService {
  private apiUrl = '/api/deadline';

  constructor(private http: HttpClient) { }

  getSecondsLeft(): Observable<number> {
    return this.http.get<{ secondsLeft: number }>(this.apiUrl).pipe(
      map((response) => response.secondsLeft),
      catchError((error) => {
        console.error('Error fetching deadline:', error);
        return throwError(error);
      })
    );
  }
}
