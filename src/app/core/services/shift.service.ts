import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shift } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private readonly apiUrl = 'http://localhost:3000/api/shifts';

  constructor(private http: HttpClient) {}

  getMyShifts(place?: string, fromDate?: string, toDate?: string): Observable<Shift[]> {
    let params = new HttpParams();
    if (place) params = params.set('place', place);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<Shift[]>(`${this.apiUrl}/my`, { params });
  }

  getAllShifts(workerName?: string, place?: string, fromDate?: string, toDate?: string): Observable<Shift[]> {
    let params = new HttpParams();
    if (workerName) params = params.set('workerName', workerName);
    if (place) params = params.set('place', place);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<Shift[]>(this.apiUrl, { params });
  }

  getShiftsByWorkerId(workerId: string, place?: string, fromDate?: string, toDate?: string): Observable<Shift[]> {
    let params = new HttpParams();
    if (place) params = params.set('place', place);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<Shift[]>(`${this.apiUrl}/worker/${workerId}`, { params });
  }

  getShiftBySlug(slug: string): Observable<Shift> {
    return this.http.get<Shift>(`${this.apiUrl}/${slug}`);
  }

  createShift(shift: Omit<Shift, 'id' | 'totalProfit'>): Observable<Shift> {
    return this.http.post<Shift>(this.apiUrl, shift);
  }

  updateShift(slug: string, shift: Partial<Shift>): Observable<Shift> {
    return this.http.put<Shift>(`${this.apiUrl}/${slug}`, shift);
  }
}
