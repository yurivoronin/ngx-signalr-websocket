using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace SignalR.Example
{
  public class AppHub : Hub
  {
    public int Add(int x, int y)
    {
      return x + y;
    }

    public async IAsyncEnumerable<int> Enumerate(int count, int? delayMilliseconds = default)
    {
      for (int i = 0; i < count; i++)
      {
        if (delayMilliseconds.HasValue)
        {
          await Task.Delay(delayMilliseconds.Value);
        }

        yield return i;
      }
    }

    public async Task Repeat(int value)
    {
      await Clients.Caller.SendAsync("Receive", value);
    }
  }
}
